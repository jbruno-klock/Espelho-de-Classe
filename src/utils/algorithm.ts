import { Classroom, Student, GenerationOptions, GenerationReport, ConflictDiagnostic } from '../types';

export interface DeskPosition {
  id: string;
  row: number;
  col: number;
}

export function getActiveDesks(classroom: Classroom): DeskPosition[] {
  const desks: DeskPosition[] = [];
  const { rows, cols, activeDesks } = classroom.roomConfig;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `r${r}_c${c}`;
      if (activeDesks[id] !== false) {
        desks.push({ id, row: r, col: c });
      }
    }
  }

  return desks;
}

// Euclidean distance between two desks
export function calculateDistance(d1: DeskPosition, d2: DeskPosition): number {
  const dr = d1.row - d2.row;
  const dc = d1.col - d2.col;
  return Math.sqrt(dr * dr + dc * dc);
}

// Chebyshev distance (grid neighborhood distance)
export function calculateGridChebyshev(d1: DeskPosition, d2: DeskPosition): number {
  return Math.max(Math.abs(d1.row - d2.row), Math.abs(d1.col - d2.col));
}

// Calculate individual placement fitness
export function evaluateSeatingScore(
  seating: Record<string, string | null>,
  classroom: Classroom,
  options: GenerationOptions
): { score: number; conflicts: ConflictDiagnostic[]; affinitiesMet: number; totalAffinities: number; specialNeedsMet: number; totalSpecialNeeds: number; talkativeIsolated: number; totalTalkative: number } {
  const deskMap = new Map<string, DeskPosition>();
  const activeDesks = getActiveDesks(classroom);
  activeDesks.forEach(d => deskMap.set(d.id, d));

  const studentMap = new Map<string, Student>();
  classroom.students.forEach(s => studentMap.set(s.id, s));

  // Map student -> desk
  const studentToDesk = new Map<string, DeskPosition>();
  Object.entries(seating).forEach(([deskId, studentId]) => {
    if (studentId && deskMap.has(deskId)) {
      studentToDesk.set(studentId, deskMap.get(deskId)!);
    }
  });

  const conflicts: ConflictDiagnostic[] = [];
  let penaltyPoints = 0;
  let bonusPoints = 0;
  let affinitiesMet = 0;
  let totalAffinities = 0;
  let specialNeedsMet = 0;
  let totalSpecialNeeds = 0;
  let talkativeIsolated = 0;
  let totalTalkative = 0;

  const countedPairs = new Set<string>();

  // 1. Evaluate Student-to-Student interactions (Anti-affinities, Affinities, Talkative collisions)
  const students = classroom.students;
  for (let i = 0; i < students.length; i++) {
    const s1 = students[i];
    const d1 = studentToDesk.get(s1.id);

    if (s1.behavior === 'talkative') {
      totalTalkative++;
    }

    // Special Needs checks
    const hasFrontNeed = s1.specialNeeds.some(n => ['low_vision', 'hearing_impairment', 'adhd_focus'].includes(n)) || 
      s1.visionNeeds === 'needs_front' || 
      s1.hearingNeeds === 'needs_front' || 
      s1.preferredRow === 'front';
    const hasBackNeed = s1.specialNeeds.includes('tall_student') || s1.preferredRow === 'back';
    const hasMobilityNeed = s1.specialNeeds.includes('wheelchair_mobility') || s1.reducedMobility;

    if (hasFrontNeed || hasBackNeed || hasMobilityNeed) {
      totalSpecialNeeds++;
    }

    if (d1) {
      if (hasFrontNeed) {
        if (d1.row === 0) {
          bonusPoints += 80 * (options.specialNeedsWeight / 5);
          specialNeedsMet++;
        } else if (d1.row === 1) {
          bonusPoints += 30 * (options.specialNeedsWeight / 5);
          specialNeedsMet++;
        } else {
          const rowPenalty = (d1.row - 1) * 120 * (options.specialNeedsWeight / 5);
          penaltyPoints += rowPenalty;
          conflicts.push({
            id: `sn-front-${s1.id}`,
            type: 'front_need_violated',
            severity: d1.row >= 3 ? 'critical' : 'warning',
            student1Id: s1.id,
            student1Name: s1.name,
            desk1Id: d1.id,
            description: `${s1.name} tem necessidade de sentar na frente (${s1.specialNeedsNotes || 'visão/audição/foco'}), mas está na fileira ${d1.row + 1}.`,
          });
        }
      } else if (hasBackNeed) {
        const lastRow = classroom.roomConfig.rows - 1;
        if (d1.row >= lastRow - 1) {
          bonusPoints += 60 * (options.specialNeedsWeight / 5);
          specialNeedsMet++;
        } else if (d1.row === 0) {
          penaltyPoints += 150 * (options.specialNeedsWeight / 5);
          conflicts.push({
            id: `sn-back-${s1.id}`,
            type: 'back_need_violated',
            severity: 'warning',
            student1Id: s1.id,
            student1Name: s1.name,
            desk1Id: d1.id,
            description: `${s1.name} é alto(a) ou prefere fundo, mas está na primeira fileira (pode obstruir a visão de colegas).`,
          });
        }
      }

      if (hasMobilityNeed) {
        // Aisle/accessible desk preference (first row or outer columns)
        const isOuterCol = d1.col === 0 || d1.col === classroom.roomConfig.cols - 1;
        if (isOuterCol || d1.row === 0) {
          bonusPoints += 50 * (options.specialNeedsWeight / 5);
          specialNeedsMet++;
        }
      }
    }

    // Pair interactions
    for (let j = i + 1; j < students.length; j++) {
      const s2 = students[j];
      const d2 = studentToDesk.get(s2.id);

      const pairKey = [s1.id, s2.id].sort().join('_');
      if (countedPairs.has(pairKey)) continue;
      countedPairs.add(pairKey);

      // Determine anti-affinity relationship, level, and category
      const s1AntiRelation = s1.antiAffinityDetails?.find(r => r.targetStudentId === s2.id);
      const s2AntiRelation = s2.antiAffinityDetails?.find(r => r.targetStudentId === s1.id);
      const isAntiAffinity = !!s1AntiRelation || !!s2AntiRelation || s1.antiAffinities.includes(s2.id) || s2.antiAffinities.includes(s1.id);
      
      const antiLevel = s1AntiRelation?.level || s2AntiRelation?.level || 'moderate';
      const antiCategory = s1AntiRelation?.category || s2AntiRelation?.category || 'Desafeto / Conversa';

      // Determine affinity relationship, level, and category
      const s1AffRelation = s1.affinityDetails?.find(r => r.targetStudentId === s2.id);
      const s2AffRelation = s2.affinityDetails?.find(r => r.targetStudentId === s1.id);
      const isAffinity = !!s1AffRelation || !!s2AffRelation || s1.affinities.includes(s2.id) || s2.affinities.includes(s1.id);

      const affLevel = s1AffRelation?.level || s2AffRelation?.level || 'medium';
      const affCategory = s1AffRelation?.category || s2AffRelation?.category || 'Afinidade Pedagógica';

      if (isAffinity) {
        totalAffinities++;
      }

      if (!d1 || !d2) continue;

      const dist = calculateDistance(d1, d2);
      const gridDist = calculateGridChebyshev(d1, d2);

      // Anti-Affinity Conflict evaluation with Level & Category
      if (isAntiAffinity) {
        // Multiplier based on anti-affinity severity level
        let levelMultiplier = 1.0;
        if (antiLevel === 'critical') levelMultiplier = 1.6;
        else if (antiLevel === 'mild') levelMultiplier = 0.6;

        if (gridDist <= 1) { // Direct neighbor (adjacent or diagonal)
          const basePenalty = dist <= 1.05 ? 650 : 420;
          penaltyPoints += basePenalty * levelMultiplier * (options.antiAffinityWeight / 5);
          
          conflicts.push({
            id: `anti-${pairKey}`,
            type: 'anti_affinity',
            severity: antiLevel === 'critical' || dist <= 1.05 ? 'critical' : 'warning',
            student1Id: s1.id,
            student2Id: s2.id,
            student1Name: s1.name,
            student2Name: s2.name,
            desk1Id: d1.id,
            desk2Id: d2.id,
            distance: Number(dist.toFixed(1)),
            category: antiCategory,
            level: antiLevel,
            description: `[${antiCategory}] ${s1.name} e ${s2.name} possuem restrição (${antiLevel === 'critical' ? 'Crítica' : antiLevel === 'mild' ? 'Leve' : 'Moderada'}) e estão a ${dist.toFixed(1)} carteira(s) de distância.`,
          });
        } else if (dist <= 2.2) {
          // If critical, even 2 desks away is a minor warning
          if (antiLevel === 'critical') {
            penaltyPoints += 220 * (options.antiAffinityWeight / 5);
            conflicts.push({
              id: `anti-warn-${pairKey}`,
              type: 'anti_affinity',
              severity: 'warning',
              student1Id: s1.id,
              student2Id: s2.id,
              student1Name: s1.name,
              student2Name: s2.name,
              desk1Id: d1.id,
              desk2Id: d2.id,
              distance: Number(dist.toFixed(1)),
              category: antiCategory,
              level: antiLevel,
              description: `[${antiCategory}] Restrição Crítica: ${s1.name} e ${s2.name} devem ser mantidos em extremidades opostas (distância atual: ${dist.toFixed(1)}).`,
            });
          } else {
            penaltyPoints += 120 * levelMultiplier * (options.antiAffinityWeight / 5);
          }
        }
      }

      // Affinity Bonus with Level & Category
      if (isAffinity) {
        let affLevelMultiplier = 1.0;
        if (affLevel === 'high') affLevelMultiplier = 1.5;
        else if (affLevel === 'low') affLevelMultiplier = 0.6;

        if (options.mode === 'focus_pairs') {
          // Ideal distance is 1 (direct neighbor in pair)
          if (dist === 1) {
            bonusPoints += 140 * affLevelMultiplier * (options.affinityWeight / 5);
            affinitiesMet++;
          } else if (dist <= 1.5) {
            bonusPoints += 80 * affLevelMultiplier * (options.affinityWeight / 5);
            affinitiesMet++;
          }
        } else {
          if (dist >= 1 && dist <= 2.2 && !(s1.behavior === 'talkative' && s2.behavior === 'talkative')) {
            bonusPoints += 70 * affLevelMultiplier * (options.affinityWeight / 5);
            affinitiesMet++;
          }
        }
      }

      // Two talkative students sitting together
      if (s1.behavior === 'talkative' && s2.behavior === 'talkative') {
        if (gridDist <= 1) {
          penaltyPoints += 300 * (options.separateTalkativeWeight / 5);
          conflicts.push({
            id: `talkative-${pairKey}`,
            type: 'two_talkative',
            severity: 'warning',
            student1Id: s1.id,
            student2Id: s2.id,
            student1Name: s1.name,
            student2Name: s2.name,
            desk1Id: d1.id,
            desk2Id: d2.id,
            distance: Number(dist.toFixed(1)),
            description: `Risco de conversas excessivas: ${s1.name} e ${s2.name} são ambos muito conversadores e estão lado a lado.`,
          });
        }
      }
    }
  }

  // Count talkative isolation
  students.forEach(s => {
    if (s.behavior === 'talkative') {
      const d = studentToDesk.get(s.id);
      if (d) {
        const hasTalkativeNeighbor = students.some(other => {
          if (other.id === s.id || other.behavior !== 'talkative') return false;
          const otherD = studentToDesk.get(other.id);
          if (!otherD) return false;
          return calculateGridChebyshev(d, otherD) <= 1;
        });
        if (!hasTalkativeNeighbor) talkativeIsolated++;
      }
    }
  });

  // Calculate final normalized score 0 - 100
  const maxPotentialScore = 1000;
  const rawScore = maxPotentialScore + bonusPoints - penaltyPoints;
  const normalizedScore = Math.max(0, Math.min(100, Math.round((rawScore / maxPotentialScore) * 100)));

  return {
    score: normalizedScore,
    conflicts,
    affinitiesMet,
    totalAffinities,
    specialNeedsMet,
    totalSpecialNeeds,
    talkativeIsolated,
    totalTalkative,
  };
}

export function generateReport(
  seating: Record<string, string | null>,
  classroom: Classroom,
  options: GenerationOptions
): GenerationReport {
  const result = evaluateSeatingScore(seating, classroom, options);

  let grade: GenerationReport['grade'] = 'A+';
  if (result.score >= 95 && result.conflicts.filter(c => c.severity === 'critical').length === 0) grade = 'A+';
  else if (result.score >= 85) grade = 'A';
  else if (result.score >= 70) grade = 'B';
  else if (result.score >= 50) grade = 'C';
  else grade = 'D';

  let summary = '';
  const criticalCount = result.conflicts.filter(c => c.severity === 'critical').length;
  const warningCount = result.conflicts.filter(c => c.severity === 'warning').length;

  if (criticalCount === 0 && warningCount === 0) {
    summary = 'Excelente distribuição! Zero conflitos detectados e todas as restrições pedagógicas foram atendidas perfeitamente.';
  } else if (criticalCount === 0) {
    summary = `Boa distribuição (${result.score}% de harmonia). Nenhum conflito crítico e ${warningCount} ponto(s) de atenção leve(s).`;
  } else {
    summary = `Atenção: Existem ${criticalCount} conflito(s) crítico(s) de proximidade que requerem ajuste ou troca de carteiras.`;
  }

  return {
    score: result.score,
    grade,
    conflicts: result.conflicts,
    affinitiesSatisfied: result.affinitiesMet,
    totalAffinities: result.totalAffinities,
    specialNeedsSatisfied: result.specialNeedsMet,
    totalSpecialNeeds: result.totalSpecialNeeds,
    talkativeIsolated: result.talkativeIsolated,
    totalTalkative: result.totalTalkative,
    summary,
  };
}

/**
 * Intelligent Seating Optimizer Engine (Simulated Annealing + Heuristic Multi-pass)
 */
export function runSeatingOptimizer(
  classroom: Classroom,
  options: GenerationOptions,
  onProgress?: (progress: number) => void
): { seatingMap: Record<string, string | null>; report: GenerationReport } {
  const activeDesks = getActiveDesks(classroom);
  const students = [...classroom.students];
  const lockedDesks = classroom.lockedDesks || {};

  // Sort desks by row, then col
  activeDesks.sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row);

  const availableDesks = activeDesks.filter(d => !lockedDesks[d.id]);
  const availableStudents = students.filter(s => {
    const isLockedInSeating = Object.entries(classroom.seatingMap || {}).some(
      ([deskId, sId]) => sId === s.id && lockedDesks[deskId]
    );
    return !isLockedInSeating;
  });

  // Best state tracker across restarts
  let globalBestSeating: Record<string, string | null> = {};
  let globalBestScore = -999999;

  const RESTARTS = 8;
  const ITERATIONS_PER_RESTART = 1200;

  for (let restart = 0; restart < RESTARTS; restart++) {
    // Current working seating
    const currentSeating: Record<string, string | null> = {};
    
    // Copy locked desks
    Object.entries(classroom.seatingMap || {}).forEach(([deskId, sId]) => {
      if (lockedDesks[deskId] && sId) {
        currentSeating[deskId] = sId;
      }
    });

    // Smart initial placement
    const frontNeeds = availableStudents.filter(s =>
      s.specialNeeds.some(n => ['low_vision', 'hearing_impairment', 'adhd_focus'].includes(n)) || 
      s.visionNeeds === 'needs_front' || 
      s.hearingNeeds === 'needs_front' || 
      s.preferredRow === 'front'
    );
    const backNeeds = availableStudents.filter(s =>
      s.specialNeeds.includes('tall_student') || s.preferredRow === 'back'
    );
    const otherStudents = availableStudents.filter(s => !frontNeeds.includes(s) && !backNeeds.includes(s));

    // Shuffle each group with random perturbation
    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const orderedStudents: Student[] = [
      ...shuffle(frontNeeds),
      ...shuffle(otherStudents),
      ...shuffle(backNeeds)
    ];

    // Shuffle desks with bias towards front for frontNeeds
    const shuffledDesks = [...availableDesks];
    // Simple initial assignment
    for (let i = 0; i < shuffledDesks.length; i++) {
      const desk = shuffledDesks[i];
      currentSeating[desk.id] = orderedStudents[i] ? orderedStudents[i].id : null;
    }

    // Evaluate initial score
    let currentEval = evaluateSeatingScore(currentSeating, classroom, options);
    let currentScore = currentEval.score * 10 - currentEval.conflicts.filter(c => c.severity === 'critical').length * 500;
    
    let bestLocalSeating = { ...currentSeating };
    let bestLocalScore = currentScore;

    // Simulated Annealing
    let temperature = 100.0;
    const coolingRate = 0.994;

    for (let iter = 0; iter < ITERATIONS_PER_RESTART; iter++) {
      if (availableDesks.length < 2) break;

      // Pick two random available desks to swap
      const idxA = Math.floor(Math.random() * availableDesks.length);
      let idxB = Math.floor(Math.random() * availableDesks.length);
      while (idxA === idxB && availableDesks.length > 1) {
        idxB = Math.floor(Math.random() * availableDesks.length);
      }

      const deskA = availableDesks[idxA].id;
      const deskB = availableDesks[idxB].id;

      // Swap
      const studentA = currentSeating[deskA] || null;
      const studentB = currentSeating[deskB] || null;

      currentSeating[deskA] = studentB;
      currentSeating[deskB] = studentA;

      const newEval = evaluateSeatingScore(currentSeating, classroom, options);
      const newScore = newEval.score * 10 - newEval.conflicts.filter(c => c.severity === 'critical').length * 500;

      const delta = newScore - currentScore;

      // Acceptance criterion
      if (delta > 0 || Math.exp(delta / temperature) > Math.random()) {
        currentScore = newScore;
        if (currentScore > bestLocalScore) {
          bestLocalScore = currentScore;
          bestLocalSeating = { ...currentSeating };
        }
      } else {
        // Revert swap
        currentSeating[deskA] = studentA;
        currentSeating[deskB] = studentB;
      }

      temperature *= coolingRate;
    }

    if (bestLocalScore > globalBestScore) {
      globalBestScore = bestLocalScore;
      globalBestSeating = { ...bestLocalSeating };
    }

    if (onProgress) {
      onProgress(Math.round(((restart + 1) / RESTARTS) * 100));
    }
  }

  const finalReport = generateReport(globalBestSeating, classroom, options);

  return {
    seatingMap: globalBestSeating,
    report: finalReport,
  };
}
