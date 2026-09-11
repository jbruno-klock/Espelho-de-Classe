import { Classroom, Student, GenerationOptions, GenerationReport, ConflictDiagnostic, ConflictSuggestion, CanBeNearLevel, CannotBeNearLevel, AlphabeticalGenerationOptions } from '../types';

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

// Chebyshev distance (grid neighborhood perimeter distance: 1 = adjacent/diagonal)
export function calculateGridChebyshev(d1: DeskPosition, d2: DeskPosition): number {
  return Math.max(Math.abs(d1.row - d2.row), Math.abs(d1.col - d2.col));
}

// Manhattan distance (grid steps)
export function calculateManhattan(d1: DeskPosition, d2: DeskPosition): number {
  return Math.abs(d1.row - d2.row) + Math.abs(d1.col - d2.col);
}

// Parse affinity priority score and multipliers
export function parseAffinityScore(level: any): { level: CanBeNearLevel; priorityPoints: number; multiplier: number; label: string } {
  if (level === 'high' || level === 3 || level === '3' || level === '+3') {
    return { level: 'high', priorityPoints: 3, multiplier: 2.2, label: 'Alta (+3)' };
  }
  if (level === 'low' || level === 1 || level === '1' || level === '+1') {
    return { level: 'low', priorityPoints: 1, multiplier: 0.85, label: 'Baixa (+1)' };
  }
  return { level: 'medium', priorityPoints: 2, multiplier: 1.45, label: 'Média (+2)' };
}

// Parse anti-affinity severity score and multipliers
export function parseAntiAffinityScore(level: any): { level: CannotBeNearLevel; severityPoints: number; multiplier: number; label: string } {
  if (level === 'critical' || level === -3 || level === 3 || level === '-3' || level === 'critical') {
    return { level: 'critical', severityPoints: 3, multiplier: 2.5, label: 'Crítica (-3 / Separação Obrigatória)' };
  }
  if (level === 'mild' || level === -1 || level === 1 || level === '-1') {
    return { level: 'mild', severityPoints: 1, multiplier: 0.8, label: 'Leve (-1 / Afastamento Recomendado)' };
  }
  return { level: 'moderate', severityPoints: 2, multiplier: 1.5, label: 'Moderada (-2 / Evitar Vizinhança)' };
}

export interface SeatingEvaluationResult {
  score: number;
  rawFitness: number;
  conflicts: ConflictDiagnostic[];
  affinitiesMet: number;
  totalAffinities: number;
  specialNeedsMet: number;
  totalSpecialNeeds: number;
  talkativeIsolated: number;
  totalTalkative: number;
}

// Calculate individual placement fitness with continuous gradient and point weighting
export function evaluateSeatingScore(
  seating: Record<string, string | null>,
  classroom: Classroom,
  options: GenerationOptions
): SeatingEvaluationResult {
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

  // Multiplier weights from user options
  const affWeight = (options.affinityWeight || 7) / 5;
  const antiWeight = (options.antiAffinityWeight || 9) / 5;
  const snWeight = (options.specialNeedsWeight || 10) / 5;
  const talkWeight = (options.separateTalkativeWeight || 8) / 5;

  // 1. Evaluate Individual Student constraints (Special Needs, Front/Back, etc.)
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
          bonusPoints += 140 * snWeight;
          specialNeedsMet++;
        } else if (d1.row === 1) {
          bonusPoints += 60 * snWeight;
          specialNeedsMet++;
        } else {
          const rowPenalty = (d1.row - 1) * 220 * snWeight;
          penaltyPoints += rowPenalty;
          conflicts.push({
            id: `sn-front-${s1.id}`,
            type: 'front_need_violated',
            severity: d1.row >= 3 ? 'critical' : 'warning',
            student1Id: s1.id,
            student1Name: s1.name,
            desk1Id: d1.id,
            description: `${s1.name} tem necessidade de sentar na frente (${s1.specialNeedsNotes || 'baixa visão / audição / foco'}), mas está na fileira ${d1.row + 1}.`,
          });
        }
      } else if (hasBackNeed) {
        const lastRow = classroom.roomConfig.rows - 1;
        if (d1.row >= lastRow - 1) {
          bonusPoints += 80 * snWeight;
          specialNeedsMet++;
        } else if (d1.row === 0) {
          penaltyPoints += 250 * snWeight;
          conflicts.push({
            id: `sn-back-${s1.id}`,
            type: 'back_need_violated',
            severity: 'warning',
            student1Id: s1.id,
            student1Name: s1.name,
            desk1Id: d1.id,
            description: `${s1.name} é alto(a) ou prefere o fundo, mas está na primeira fileira (pode obstruir a visão de colegas).`,
          });
        }
      }

      if (hasMobilityNeed) {
        const isOuterCol = d1.col === 0 || d1.col === classroom.roomConfig.cols - 1;
        if (isOuterCol || d1.row === 0) {
          bonusPoints += 70 * snWeight;
          specialNeedsMet++;
        }
      }
    }

    // Pair interactions (Proximity: Can Be Near vs Cannot Be Near)
    for (let j = i + 1; j < students.length; j++) {
      const s2 = students[j];
      const d2 = studentToDesk.get(s2.id);

      const pairKey = [s1.id, s2.id].sort().join('_');
      if (countedPairs.has(pairKey)) continue;
      countedPairs.add(pairKey);

      // Determine Anti-Affinity ("NÃO Podem Ficar Perto")
      const s1AntiRelation = s1.antiAffinityDetails?.find(r => r.targetStudentId === s2.id);
      const s2AntiRelation = s2.antiAffinityDetails?.find(r => r.targetStudentId === s1.id);
      const isAntiAffinity = !!s1AntiRelation || !!s2AntiRelation || s1.antiAffinities.includes(s2.id) || s2.antiAffinities.includes(s1.id);
      
      const rawAntiLevel = s1AntiRelation?.level === 'critical' || s2AntiRelation?.level === 'critical'
        ? 'critical'
        : (s1AntiRelation?.level || s2AntiRelation?.level || 'moderate');
      const antiScore = parseAntiAffinityScore(rawAntiLevel);
      const antiCategory = s1AntiRelation?.category || s2AntiRelation?.category || 'Desafeto / Conversa';

      // Determine Affinity ("Podem Ficar Perto")
      const s1AffRelation = s1.affinityDetails?.find(r => r.targetStudentId === s2.id);
      const s2AffRelation = s2.affinityDetails?.find(r => r.targetStudentId === s1.id);
      const isAffinity = !isAntiAffinity && (!!s1AffRelation || !!s2AffRelation || s1.affinities.includes(s2.id) || s2.affinities.includes(s1.id));

      const rawAffLevel = s1AffRelation?.level === 'high' || s2AffRelation?.level === 'high'
        ? 'high'
        : (s1AffRelation?.level === 'low' && s2AffRelation?.level === 'low' ? 'low' : (s1AffRelation?.level || s2AffRelation?.level || 'medium'));
      const affScore = parseAffinityScore(rawAffLevel);
      const affCategory = s1AffRelation?.category || s2AffRelation?.category || 'Apoio Pedagógico';

      if (isAffinity) {
        totalAffinities++;
      }

      if (!d1 || !d2) continue;

      const dist = calculateDistance(d1, d2);
      const gridDist = calculateGridChebyshev(d1, d2);
      const isOrthogonal = Math.abs(d1.row - d2.row) + Math.abs(d1.col - d2.col) === 1; // Side-by-side or front/behind (dist === 1)
      const isDiagonal = Math.abs(d1.row - d2.row) === 1 && Math.abs(d1.col - d2.col) === 1; // Immediate diagonal (dist ≈ 1.41)

      // ========================================================
      // 1. "NÃO PODEM FICAR PERTO" (Anti-Affinity / Distanciamento)
      // ========================================================
      if (isAntiAffinity) {
        const severityMultiplier = antiScore.multiplier * antiWeight;

        if (isOrthogonal || dist <= 1.05) {
          // Direct orthogonal neighbor (adjacent desk) - CATASTROPHIC VIOLATION
          const penalty = 1800 * severityMultiplier;
          penaltyPoints += penalty;

          conflicts.push({
            id: `anti-ortho-${pairKey}`,
            type: 'anti_affinity',
            severity: 'critical',
            student1Id: s1.id,
            student2Id: s2.id,
            student1Name: s1.name,
            student2Name: s2.name,
            desk1Id: d1.id,
            desk2Id: d2.id,
            distance: Number(dist.toFixed(1)),
            category: antiCategory,
            level: antiScore.level,
            description: `[${antiCategory}] Violação Crítica de Proximidade: ${s1.name} e ${s2.name} NÃO podem ficar perto (${antiScore.label}), mas estão lado a lado (distância: ${dist.toFixed(1)} carteira).`,
          });
        } else if (isDiagonal || dist <= 1.45) {
          // Diagonal neighbor - SEVERE VIOLATION
          const penalty = 1200 * severityMultiplier;
          penaltyPoints += penalty;

          conflicts.push({
            id: `anti-diag-${pairKey}`,
            type: 'anti_affinity',
            severity: antiScore.level === 'critical' ? 'critical' : 'warning',
            student1Id: s1.id,
            student2Id: s2.id,
            student1Name: s1.name,
            student2Name: s2.name,
            desk1Id: d1.id,
            desk2Id: d2.id,
            distance: Number(dist.toFixed(1)),
            category: antiCategory,
            level: antiScore.level,
            description: `[${antiCategory}] Violação de Proximidade: ${s1.name} e ${s2.name} NÃO podem ficar perto (${antiScore.label}), mas estão em carteiras diagonais vizinhas (distância: ${dist.toFixed(1)} carteiras).`,
          });
        } else if (dist <= 2.25) {
          // Close proximity (1 desk between or knight's move)
          if (antiScore.level === 'critical') {
            penaltyPoints += 650 * severityMultiplier;
            conflicts.push({
              id: `anti-close-${pairKey}`,
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
              level: antiScore.level,
              description: `[${antiCategory}] Alerta de Distanciamento: ${s1.name} e ${s2.name} possuem restrição de Separação Obrigatória e estão muito próximos (distância: ${dist.toFixed(1)} carteiras).`,
            });
          } else {
            penaltyPoints += 320 * severityMultiplier;
          }
        } else if (dist <= 3.2 && antiScore.level === 'critical') {
          // Keep pushing critical anti-affinities to opposite corners
          penaltyPoints += 180 * severityMultiplier;
        } else if (dist >= 3.5 || gridDist >= 3) {
          // Successfully isolated and distanced! Reward the algorithm
          bonusPoints += 100 * severityMultiplier;
        }
      }

      // ========================================================
      // 2. "PODEM FICAR PERTO" (Affinity / Proximidade Recomendada)
      // ========================================================
      if (isAffinity) {
        const priorityMultiplier = affScore.multiplier * affWeight;

        if (isOrthogonal || dist <= 1.05) {
          // Direct orthogonal neighbor (adjacent desk) - MAXIMUM BONUS
          bonusPoints += 550 * priorityMultiplier;
          affinitiesMet++;
        } else if (isDiagonal || dist <= 1.45) {
          // Immediate diagonal neighbor - STRONG BONUS
          bonusPoints += 380 * priorityMultiplier;
          affinitiesMet++;
        } else if (dist <= 2.25) {
          // Close neighbor (1 desk separation)
          bonusPoints += 180 * priorityMultiplier;
          if (affScore.level !== 'high') {
            affinitiesMet++;
          }
        } else if (dist <= 3.0) {
          // Moderate proximity
          bonusPoints += 60 * priorityMultiplier;
        } else {
          // DISTANT: If they can/should be near, being on opposite ends of the room incurs a distance gradient penalty
          // This ensures Simulated Annealing continuously pulls them closer with zero flat plateaus!
          penaltyPoints += (dist - 2.5) * 80 * priorityMultiplier;
        }
      }

      // ========================================================
      // 3. Two Talkative Students Collision (Conversadores)
      // ========================================================
      // Only penalize if the teacher DID NOT explicitly mark them as "Podem Ficar Perto"
      if (!isAffinity && s1.behavior === 'talkative' && s2.behavior === 'talkative') {
        if (gridDist <= 1) {
          penaltyPoints += 360 * talkWeight;
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
            description: `Risco de dispersão: ${s1.name} e ${s2.name} são ambos muito conversadores e estão lado a lado sem afinidade pedagógica.`,
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

  // Calculate uncapped continuous fitness function for simulated annealing
  const criticalCount = conflicts.filter(c => c.severity === 'critical').length;
  const warningCount = conflicts.filter(c => c.severity === 'warning').length;
  const rawFitness = bonusPoints - penaltyPoints - (criticalCount * 2500);

  // Calculate normalized display score (0 - 100%) for report and UI
  let displayScore = 100;
  displayScore -= criticalCount * 30;
  displayScore -= warningCount * 7;

  if (totalAffinities > 0) {
    const unmetAff = totalAffinities - affinitiesMet;
    if (unmetAff > 0) {
      displayScore -= Math.round((unmetAff / totalAffinities) * 25);
    }
  }

  if (totalSpecialNeeds > 0) {
    const unmetSN = totalSpecialNeeds - specialNeedsMet;
    if (unmetSN > 0) {
      displayScore -= Math.round((unmetSN / totalSpecialNeeds) * 20);
    }
  }

  const normalizedScore = Math.max(15, Math.min(100, Math.round(displayScore)));

  return {
    score: normalizedScore,
    rawFitness,
    conflicts,
    affinitiesMet,
    totalAffinities,
    specialNeedsMet,
    totalSpecialNeeds,
    talkativeIsolated,
    totalTalkative,
  };
}

/**
 * Generates actionable, mathematically verified correction suggestions for a given conflict.
 * Tests candidate desk moves and swaps to find options that eliminate the conflict and maximize harmony score.
 */
export function generateConflictSuggestions(
  conflict: ConflictDiagnostic,
  classroom: Classroom,
  currentSeating: Record<string, string | null>,
  options: GenerationOptions
): ConflictSuggestion[] {
  const activeDesks = getActiveDesks(classroom);
  const lockedDesks = classroom.lockedDesks || {};
  const studentMap = new Map<string, Student>();
  classroom.students.forEach(s => studentMap.set(s.id, s));
  const deskMap = new Map<string, DeskPosition>();
  activeDesks.forEach(d => deskMap.set(d.id, d));

  const currentEval = evaluateSeatingScore(currentSeating, classroom, options);
  const currentScore = currentEval.score;
  const currentCriticalCount = currentEval.conflicts.filter(c => c.severity === 'critical').length;

  const s1 = studentMap.get(conflict.student1Id);
  const s2 = conflict.student2Id ? studentMap.get(conflict.student2Id) : undefined;
  if (!s1) return [];

  // Determine students that can be moved
  const moveableStudents: { student: Student; deskId: string; otherStudent?: Student }[] = [];
  if (!lockedDesks[conflict.desk1Id]) {
    moveableStudents.push({ student: s1, deskId: conflict.desk1Id, otherStudent: s2 });
  }
  if (s2 && conflict.desk2Id && !lockedDesks[conflict.desk2Id]) {
    moveableStudents.push({ student: s2, deskId: conflict.desk2Id, otherStudent: s1 });
  }

  if (moveableStudents.length === 0) {
    return [];
  }

  interface CandidateMove {
    sourceStudent: Student;
    sourceDeskId: string;
    otherStudent?: Student;
    targetDesk: DeskPosition;
    targetStudent?: Student;
    simScore: number;
    scoreDelta: number;
    resolvedThisConflict: boolean;
    criticalDelta: number;
    rankScore: number;
  }

  const candidateMoves: CandidateMove[] = [];

  for (const moveItem of moveableStudents) {
    const { student: sourceStudent, deskId: sourceDeskId, otherStudent } = moveItem;

    for (const candDesk of activeDesks) {
      if (candDesk.id === sourceDeskId) continue;
      if (otherStudent && conflict.desk2Id && candDesk.id === conflict.desk2Id && sourceDeskId === conflict.desk1Id) continue;
      if (otherStudent && conflict.desk1Id && candDesk.id === conflict.desk1Id && sourceDeskId === conflict.desk2Id) continue;
      if (lockedDesks[candDesk.id]) continue;

      const targetStudentId = currentSeating[candDesk.id];
      const targetStudent = targetStudentId ? studentMap.get(targetStudentId) : undefined;

      // Simulate swap
      const simulatedSeating = {
        ...currentSeating,
        [sourceDeskId]: targetStudentId || null,
        [candDesk.id]: sourceStudent.id,
      };

      const simEval = evaluateSeatingScore(simulatedSeating, classroom, options);
      const newCriticalCount = simEval.conflicts.filter(c => c.severity === 'critical').length;
      const criticalDelta = currentCriticalCount - newCriticalCount;
      const scoreDelta = simEval.score - currentScore;

      // Check if the original conflict still exists
      let resolvedThisConflict = false;
      if (otherStudent) {
        const pairStillHasConflict = simEval.conflicts.some(
          c => (c.student1Id === sourceStudent.id && c.student2Id === otherStudent.id) ||
               (c.student1Id === otherStudent.id && c.student2Id === sourceStudent.id)
        );
        resolvedThisConflict = !pairStillHasConflict;
      } else {
        const stillHasConflict = simEval.conflicts.some(
          c => c.student1Id === sourceStudent.id && c.type === conflict.type
        );
        resolvedThisConflict = !stillHasConflict;
      }

      // Ranking heuristic
      let rankScore = 0;
      if (resolvedThisConflict) rankScore += 600;
      rankScore += criticalDelta * 300;
      rankScore += scoreDelta * 25;

      // Anti-affinity distance reward
      if (otherStudent) {
        const otherDeskId = sourceDeskId === conflict.desk1Id ? conflict.desk2Id : conflict.desk1Id;
        const otherDeskPos = otherDeskId ? deskMap.get(otherDeskId) : undefined;
        if (otherDeskPos) {
          const dist = calculateDistance(candDesk, otherDeskPos);
          if (dist >= 3.0) rankScore += 150;
          else if (dist >= 2.0) rankScore += 80;
        }
      }

      // Front need reward
      if (conflict.type === 'front_need_violated' && (candDesk.row === 0 || candDesk.row === 1)) {
        rankScore += (2 - candDesk.row) * 140;
      }

      // Back need reward
      if (conflict.type === 'back_need_violated' && candDesk.row >= classroom.roomConfig.rows - 2) {
        rankScore += 150;
      }

      // Discard moves that worsen critical conflicts and don't even resolve this one
      if (criticalDelta < 0 && !resolvedThisConflict) continue;

      candidateMoves.push({
        sourceStudent,
        sourceDeskId,
        otherStudent,
        targetDesk: candDesk,
        targetStudent,
        simScore: simEval.score,
        scoreDelta,
        resolvedThisConflict,
        criticalDelta,
        rankScore,
      });
    }
  }

  // Sort descending by rankScore
  candidateMoves.sort((a, b) => b.rankScore - a.rankScore);

  // Take top 3 diverse suggestions
  const chosen: CandidateMove[] = [];
  const seenTargets = new Set<string>();

  for (const move of candidateMoves) {
    const key = `${move.sourceStudent.id}->${move.targetDesk.id}`;
    if (!seenTargets.has(key)) {
      seenTargets.add(key);
      chosen.push(move);
      if (chosen.length >= 3) break;
    }
  }

  // Build user-facing ConflictSuggestion objects
  return chosen.map((move, idx) => {
    const targetCoord = `Fila ${move.targetDesk.row + 1} • Coluna ${move.targetDesk.col + 1}`;
    const isMoveToEmpty = !move.targetStudent;
    const improvementDelta = Math.max(1, move.scoreDelta);
    const improvementText = move.scoreDelta > 0 ? `+${move.scoreDelta}% de harmonia` : 'resolução do conflito';

    let title = '';
    let explanation = '';

    if (conflict.type === 'anti_affinity') {
      if (isMoveToEmpty) {
        title = `Mover ${move.sourceStudent.name} para a Carteira Vazia (${targetCoord})`;
        explanation = `Desloca ${move.sourceStudent.name} para uma posição livre, afastando-se com segurança de ${move.otherStudent?.name || 'seu colega'} e garantindo ${improvementText}.`;
      } else {
        title = `Trocar ${move.sourceStudent.name} com ${move.targetStudent!.name} (${targetCoord})`;
        explanation = `Inverte a posição com ${move.targetStudent!.name}, separando definitivamente ${move.sourceStudent.name} e ${move.otherStudent?.name || 'o colega'} e alcançando ${improvementText}.`;
      }
    } else if (conflict.type === 'two_talkative') {
      if (isMoveToEmpty) {
        title = `Mover ${move.sourceStudent.name} para a Carteira Vazia (${targetCoord})`;
        explanation = `Separa os alunos conversadores, direcionando ${move.sourceStudent.name} para uma área calma (${improvementText}).`;
      } else {
        title = `Trocar ${move.sourceStudent.name} com ${move.targetStudent!.name} (${targetCoord})`;
        explanation = `Dispersa a conversa colocando um aluno de perfil focado entre eles (${improvementText}).`;
      }
    } else if (conflict.type === 'front_need_violated') {
      if (isMoveToEmpty) {
        title = `Mover ${move.sourceStudent.name} para a Frente (${targetCoord})`;
        explanation = `Aloca ${move.sourceStudent.name} na fileira frontal livre para atender à necessidade pedagógica/visão (${improvementText}).`;
      } else {
        title = `Trocar ${move.sourceStudent.name} com ${move.targetStudent!.name} na Frente (${targetCoord})`;
        explanation = `Posiciona ${move.sourceStudent.name} na frente em substituição a um aluno sem restrições visuais/auditivas (${improvementText}).`;
      }
    } else if (conflict.type === 'back_need_violated') {
      title = isMoveToEmpty
        ? `Mover ${move.sourceStudent.name} para o Fundo (${targetCoord})`
        : `Trocar ${move.sourceStudent.name} com ${move.targetStudent!.name} no Fundo (${targetCoord})`;
      explanation = `Reposiciona ${move.sourceStudent.name} para trás, liberando a visibilidade da lousa para o restante da turma (${improvementText}).`;
    } else {
      title = isMoveToEmpty
        ? `Mover para Carteira Vazia (${targetCoord})`
        : `Trocar com ${move.targetStudent!.name} (${targetCoord})`;
      explanation = `Reorganiza a carteira para resolver o ponto de atenção com ${improvementText}.`;
    }

    const impact: ConflictSuggestion['impact'] = move.resolvedThisConflict && move.criticalDelta >= 0
      ? 'resolves_completely'
      : move.scoreDelta > 0
      ? 'significantly_improves'
      : 'mitigates';

    return {
      id: `sug-${conflict.id}-${idx}`,
      conflictId: conflict.id,
      type: isMoveToEmpty ? 'move_to_empty' : 'swap',
      title,
      explanation,
      sourceDeskId: move.sourceDeskId,
      sourceStudentName: move.sourceStudent.name,
      targetDeskId: move.targetDesk.id,
      targetStudentName: move.targetStudent?.name || 'Carteira Vazia',
      targetStudentId: move.targetStudent?.id,
      expectedScoreImprovement: improvementDelta,
      impact,
    };
  });
}

/**
 * Automatically resolves conflicts iteratively by applying the best available suggestion for each issue.
 */
export function autoResolveAllConflicts(
  classroom: Classroom,
  options: GenerationOptions
): {
  seatingMap: Record<string, string | null>;
  resolvedCount: number;
  remainingConflicts: number;
} {
  let currentSeating = { ...classroom.seatingMap };
  let resolvedCount = 0;
  const maxIterations = 8;

  for (let iter = 0; iter < maxIterations; iter++) {
    const report = generateReport(currentSeating, classroom, options);
    if (report.conflicts.length === 0) break;

    const targetConflict = report.conflicts.find(c => c.severity === 'critical') || report.conflicts[0];
    const suggestions = targetConflict.suggestions || generateConflictSuggestions(targetConflict, classroom, currentSeating, options);
    if (!suggestions || suggestions.length === 0) break;

    const best = suggestions[0];
    const newSeating = { ...currentSeating };
    const temp = newSeating[best.sourceDeskId] || null;
    newSeating[best.sourceDeskId] = newSeating[best.targetDeskId] || null;
    newSeating[best.targetDeskId] = temp;

    currentSeating = newSeating;
    resolvedCount++;
  }

  const finalReport = generateReport(currentSeating, classroom, options);
  return {
    seatingMap: currentSeating,
    resolvedCount,
    remainingConflicts: finalReport.conflicts.length,
  };
}

export function generateReport(
  seating: Record<string, string | null>,
  classroom: Classroom,
  options: GenerationOptions
): GenerationReport {
  const result = evaluateSeatingScore(seating, classroom, options);

  // Attach intelligent actionable suggestions to every diagnostic conflict
  const conflictsWithSuggestions = result.conflicts.map(c => ({
    ...c,
    suggestions: generateConflictSuggestions(c, classroom, seating, options),
  }));

  let grade: GenerationReport['grade'] = 'A+';
  if (result.score >= 95 && conflictsWithSuggestions.filter(c => c.severity === 'critical').length === 0) grade = 'A+';
  else if (result.score >= 85) grade = 'A';
  else if (result.score >= 70) grade = 'B';
  else if (result.score >= 50) grade = 'C';
  else grade = 'D';

  let summary = '';
  const criticalCount = conflictsWithSuggestions.filter(c => c.severity === 'critical').length;
  const warningCount = conflictsWithSuggestions.filter(c => c.severity === 'warning').length;

  if (criticalCount === 0 && warningCount === 0) {
    if (result.totalAffinities > 0) {
      summary = `Distribuição excelente! Zero conflitos detectados e 100% das proximidades desejadas (${result.affinitiesMet}/${result.totalAffinities}) foram posicionadas juntas com sucesso.`;
    } else {
      summary = 'Excelente distribuição! Zero conflitos detectados e todas as restrições pedagógicas foram atendidas perfeitamente.';
    }
  } else if (criticalCount === 0) {
    summary = `Boa distribuição (${result.score}% de harmonia). Nenhum conflito crítico; ${result.affinitiesMet}/${result.totalAffinities} proximidades atendidas e ${warningCount} ponto(s) de atenção leve(s).`;
  } else {
    summary = `Atenção: Existem ${criticalCount} conflito(s) crítico(s) de proximidade que requerem ajuste ou troca de carteiras.`;
  }

  return {
    score: result.score,
    grade,
    conflicts: conflictsWithSuggestions,
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
 * Intelligent Seating Optimizer Engine
 * Features:
 * - Smart Proximity-Guided Initial Seeding (Pairs friends together, pushes anti-affinities apart)
 * - Adaptive Simulated Annealing with continuous rawFitness gradient
 * - Targeted Conflict & Proximity neighborhood heuristic moves
 * - Final Greedy Quenching for micro-alignment
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

  if (availableDesks.length === 0 || availableStudents.length === 0) {
    return {
      seatingMap: classroom.seatingMap || {},
      report: generateReport(classroom.seatingMap || {}, classroom, options),
    };
  }

  // Precompute desk distance lookup for lightning fast swaps
  const deskMap = new Map<string, DeskPosition>();
  activeDesks.forEach(d => deskMap.set(d.id, d));

  // Pre-categorize students
  const studentMap = new Map<string, Student>();
  classroom.students.forEach(s => studentMap.set(s.id, s));

  // Helper to shuffle array
  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Find neighbor desks of a given desk within distance threshold
  const getNearbyDesks = (deskId: string, maxDist = 1.45): DeskPosition[] => {
    const d = deskMap.get(deskId);
    if (!d) return [];
    return availableDesks.filter(other => {
      if (other.id === deskId) return false;
      return calculateDistance(d, other) <= maxDist;
    });
  };

  // Best state tracker across restarts
  let globalBestSeating: Record<string, string | null> = {};
  let globalBestFitness = -Infinity;

  const RESTARTS = 10;
  const ITERATIONS_PER_RESTART = 1400;

  for (let restart = 0; restart < RESTARTS; restart++) {
    let currentSeating: Record<string, string | null> = {};

    // 1. Copy locked desks
    Object.entries(classroom.seatingMap || {}).forEach(([deskId, sId]) => {
      if (lockedDesks[deskId] && sId) {
        currentSeating[deskId] = sId;
      }
    });

    // 2. Smart Seeding:
    // Place front needs first in rows 0 and 1
    const frontNeeds = availableStudents.filter(s =>
      s.specialNeeds.some(n => ['low_vision', 'hearing_impairment', 'adhd_focus'].includes(n)) || 
      s.visionNeeds === 'needs_front' || 
      s.hearingNeeds === 'needs_front' || 
      s.preferredRow === 'front'
    );
    const backNeeds = availableStudents.filter(s =>
      s.specialNeeds.includes('tall_student') || s.preferredRow === 'back'
    );
    const regularStudents = availableStudents.filter(s => !frontNeeds.includes(s) && !backNeeds.includes(s));

    // Desks by zone
    const frontDesks = availableDesks.filter(d => d.row <= 1);
    const backDesks = availableDesks.filter(d => d.row >= classroom.roomConfig.rows - 2);
    const midDesks = availableDesks.filter(d => !frontDesks.includes(d) && !backDesks.includes(d));

    const assignedStudents = new Set<string>();
    const assignedDesks = new Set<string>();

    // Seed front needs into front desks
    const shuffledFrontNeeds = shuffle(frontNeeds);
    const shuffledFrontDesks = shuffle(frontDesks);
    shuffledFrontNeeds.forEach((student, idx) => {
      if (idx < shuffledFrontDesks.length) {
        const desk = shuffledFrontDesks[idx];
        currentSeating[desk.id] = student.id;
        assignedStudents.add(student.id);
        assignedDesks.add(desk.id);
      }
    });

    // Seed back needs into back desks
    const shuffledBackNeeds = shuffle(backNeeds);
    const shuffledBackDesks = shuffle(backDesks);
    shuffledBackNeeds.forEach((student, idx) => {
      if (idx < shuffledBackDesks.length) {
        const desk = shuffledBackDesks[idx];
        currentSeating[desk.id] = student.id;
        assignedStudents.add(student.id);
        assignedDesks.add(desk.id);
      }
    });

    // Seed Affinity Pairs (High/Medium "Pode Ficar Perto") in adjacent/nearby desks!
    const unassignedStudents = availableStudents.filter(s => !assignedStudents.has(s.id));
    const unassignedDesks = availableDesks.filter(d => !assignedDesks.has(d.id));

    // Identify affinity clusters
    for (const student of shuffle(unassignedStudents)) {
      if (assignedStudents.has(student.id)) continue;

      // Check if student has an affinity with another unassigned student
      const affRelations = (student.affinityDetails || []).filter(r => 
        !assignedStudents.has(r.targetStudentId) && 
        availableStudents.some(s => s.id === r.targetStudentId)
      );

      // Sort by priority (high first)
      affRelations.sort((a, b) => (a.level === 'high' ? -1 : 1));

      if (affRelations.length > 0 && unassignedDesks.length >= 2) {
        const targetRel = affRelations[0];
        const partnerStudent = availableStudents.find(s => s.id === targetRel.targetStudentId);

        if (partnerStudent && !assignedStudents.has(partnerStudent.id)) {
          // Find a desk for student, and an adjacent desk for partner
          const deskAIdx = Math.floor(Math.random() * unassignedDesks.length);
          const deskA = unassignedDesks[deskAIdx];

          // Find adjacent available desk
          const adjDesks = getNearbyDesks(deskA.id, 1.45).filter(d => !assignedDesks.has(d.id));
          if (adjDesks.length > 0) {
            const deskB = adjDesks[0];

            currentSeating[deskA.id] = student.id;
            currentSeating[deskB.id] = partnerStudent.id;
            assignedStudents.add(student.id);
            assignedStudents.add(partnerStudent.id);
            assignedDesks.add(deskA.id);
            assignedDesks.add(deskB.id);

            // Remove from unassignedDesks
            const idx1 = unassignedDesks.findIndex(d => d.id === deskA.id);
            if (idx1 >= 0) unassignedDesks.splice(idx1, 1);
            const idx2 = unassignedDesks.findIndex(d => d.id === deskB.id);
            if (idx2 >= 0) unassignedDesks.splice(idx2, 1);
            continue;
          }
        }
      }
    }

    // Place remaining students into remaining desks
    const remainingStudents = shuffle(availableStudents.filter(s => !assignedStudents.has(s.id)));
    const remainingDesks = shuffle(availableDesks.filter(d => !assignedDesks.has(d.id)));

    for (let i = 0; i < remainingDesks.length; i++) {
      const desk = remainingDesks[i];
      currentSeating[desk.id] = remainingStudents[i] ? remainingStudents[i].id : null;
    }

    // Initial fitness evaluation using continuous rawFitness
    let currentEval = evaluateSeatingScore(currentSeating, classroom, options);
    let currentFitness = currentEval.rawFitness;

    let bestLocalSeating = { ...currentSeating };
    let bestLocalFitness = currentFitness;

    // Simulated Annealing with Guided Neighborhood Heuristic Moves
    let temperature = 80.0;
    const coolingRate = 0.993;

    for (let iter = 0; iter < ITERATIONS_PER_RESTART; iter++) {
      if (availableDesks.length < 2) break;

      let deskAId: string;
      let deskBId: string;

      const randomHeuristic = Math.random();

      if (randomHeuristic < 0.28 && currentEval.conflicts.length > 0) {
        // TARGETED MOVE 1: Resolve Anti-affinity or Critical Conflict
        // Pick a student involved in an active conflict
        const antiConflict = currentEval.conflicts.find(c => c.type === 'anti_affinity');
        if (antiConflict && antiConflict.desk1Id && antiConflict.desk2Id) {
          deskAId = Math.random() < 0.5 ? antiConflict.desk1Id : antiConflict.desk2Id;
          const otherDesk = deskAId === antiConflict.desk1Id ? antiConflict.desk2Id : antiConflict.desk1Id;
          const otherPos = deskMap.get(otherDesk);

          // Find candidate desks far away from the other student (distance >= 3.0)
          const farDesks = availableDesks.filter(d => {
            if (d.id === deskAId || d.id === otherDesk) return false;
            return otherPos ? calculateDistance(d, otherPos) >= 3.0 : true;
          });

          if (farDesks.length > 0) {
            deskBId = farDesks[Math.floor(Math.random() * farDesks.length)].id;
          } else {
            deskBId = availableDesks[Math.floor(Math.random() * availableDesks.length)].id;
          }
        } else {
          // Pick any conflict desk
          const conflict = currentEval.conflicts[Math.floor(Math.random() * currentEval.conflicts.length)];
          deskAId = conflict.desk1Id;
          deskBId = availableDesks[Math.floor(Math.random() * availableDesks.length)].id;
        }
      } else if (randomHeuristic < 0.56 && currentEval.totalAffinities > currentEval.affinitiesMet) {
        // TARGETED MOVE 2: Fulfill Proximity ("Podem Ficar Perto")
        // Find an affinity pair that is currently separated
        const studentToDeskMap = new Map<string, DeskPosition>();
        Object.entries(currentSeating).forEach(([dId, sId]) => {
          if (sId && deskMap.has(dId)) studentToDeskMap.set(sId, deskMap.get(dId)!);
        });

        let targetPairFound = false;
        deskAId = availableDesks[0].id;
        deskBId = availableDesks[1].id;

        for (const s1 of classroom.students) {
          const d1 = studentToDeskMap.get(s1.id);
          if (!d1 || lockedDesks[d1.id]) continue;

          for (const affId of s1.affinities || []) {
            const s2 = studentMap.get(affId);
            const d2 = s2 ? studentToDeskMap.get(s2.id) : null;

            if (d2 && !lockedDesks[d2.id]) {
              const currentDist = calculateDistance(d1, d2);
              if (currentDist > 1.45) { // Separated!
                // Try moving s2 to a neighbor desk of d1
                const nearby = getNearbyDesks(d1.id, 1.45).filter(d => !lockedDesks[d.id]);
                if (nearby.length > 0) {
                  deskAId = d2.id;
                  deskBId = nearby[Math.floor(Math.random() * nearby.length)].id;
                  targetPairFound = true;
                  break;
                }
              }
            }
          }
          if (targetPairFound) break;
        }

        if (!targetPairFound) {
          const idxA = Math.floor(Math.random() * availableDesks.length);
          let idxB = Math.floor(Math.random() * availableDesks.length);
          while (idxA === idxB) idxB = Math.floor(Math.random() * availableDesks.length);
          deskAId = availableDesks[idxA].id;
          deskBId = availableDesks[idxB].id;
        }
      } else {
        // TARGETED MOVE 3 / EXPLORATORY: Pick two random available desks
        const idxA = Math.floor(Math.random() * availableDesks.length);
        let idxB = Math.floor(Math.random() * availableDesks.length);
        while (idxA === idxB) idxB = Math.floor(Math.random() * availableDesks.length);
        deskAId = availableDesks[idxA].id;
        deskBId = availableDesks[idxB].id;
      }

      // Avoid swapping two null desks (no-op)
      const studentA = currentSeating[deskAId] || null;
      const studentB = currentSeating[deskBId] || null;
      if (!studentA && !studentB) continue;

      // Perform swap
      currentSeating[deskAId] = studentB;
      currentSeating[deskBId] = studentA;

      const newEval = evaluateSeatingScore(currentSeating, classroom, options);
      const delta = newEval.rawFitness - currentFitness;

      // Acceptance criterion (Metropolis)
      if (delta > 0 || (temperature > 0.1 && Math.exp(delta / temperature) > Math.random())) {
        currentFitness = newEval.rawFitness;
        currentEval = newEval;

        if (currentFitness > bestLocalFitness) {
          bestLocalFitness = currentFitness;
          bestLocalSeating = { ...currentSeating };
        }
      } else {
        // Revert swap
        currentSeating[deskAId] = studentA;
        currentSeating[deskBId] = studentB;
      }

      temperature *= coolingRate;
    }

    // Quenching Phase: 200 greedy deterministic iterations to polish the final local state
    currentSeating = { ...bestLocalSeating };
    currentFitness = bestLocalFitness;

    for (let q = 0; q < 220; q++) {
      const idxA = Math.floor(Math.random() * availableDesks.length);
      let idxB = Math.floor(Math.random() * availableDesks.length);
      while (idxA === idxB) idxB = Math.floor(Math.random() * availableDesks.length);

      const deskAId = availableDesks[idxA].id;
      const deskBId = availableDesks[idxB].id;

      const studentA = currentSeating[deskAId] || null;
      const studentB = currentSeating[deskBId] || null;
      if (!studentA && !studentB) continue;

      currentSeating[deskAId] = studentB;
      currentSeating[deskBId] = studentA;

      const newEval = evaluateSeatingScore(currentSeating, classroom, options);
      const delta = newEval.rawFitness - currentFitness;

      if (delta > 0) {
        currentFitness = newEval.rawFitness;
        bestLocalFitness = currentFitness;
        bestLocalSeating = { ...currentSeating };
      } else {
        currentSeating[deskAId] = studentA;
        currentSeating[deskBId] = studentB;
      }
    }

    if (bestLocalFitness > globalBestFitness) {
      globalBestFitness = bestLocalFitness;
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

/**
 * Organiza a distribuição dos estudantes nas carteiras ativas em ordem alfabética.
 * Suporta disposição por fileiras (vertical: coluna por coluna, frente ao fundo) ou por linhas (horizontal),
 * com respeito opcional a carteiras travadas (com cadeado) e alunos com necessidades de inclusão.
 */
export function generateAlphabeticalSeating(
  classroom: Classroom,
  options: AlphabeticalGenerationOptions = {}
): {
  seatingMap: Record<string, string | null>;
  report: GenerationReport;
  placedCount: number;
  totalStudents: number;
} {
  const {
    direction = 'columns',
    respectFixedDesks = true,
    sortOrder = 'asc',
    sortBy = 'name',
    respectSpecialNeeds = false,
  } = options;

  const activeDesks = getActiveDesks(classroom);
  const existingSeating = classroom.seatingMap || {};
  const lockedDesks = classroom.lockedDesks || {};
  const students = [...classroom.students];

  // 1. Sort active desks according to chosen direction
  if (direction === 'columns') {
    // Por Fileiras: Coluna por coluna, da frente para o fundo
    // Coluna 0 (row 0, 1, 2...), depois Coluna 1 (row 0, 1, 2...), etc.
    activeDesks.sort((a, b) => {
      if (a.col !== b.col) return a.col - b.col;
      return a.row - b.row;
    });
  } else {
    // Por Linhas: Linha por linha, da esquerda para a direita
    // Linha 0 (col 0, 1, 2...), depois Linha 1 (col 0, 1, 2...), etc.
    activeDesks.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
  }

  // 2. Initialize new seating map with null for all grid coordinates
  const newSeating: Record<string, string | null> = {};
  const maxRows = classroom.roomConfig?.rows || 6;
  const maxCols = classroom.roomConfig?.cols || 6;
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      newSeating[`r${r}_c${c}`] = null;
    }
  }

  // 3. Process locked desks
  const lockedStudentIds = new Set<string>();
  const availableDesks: DeskPosition[] = [];

  for (const desk of activeDesks) {
    if (respectFixedDesks && lockedDesks[desk.id] && existingSeating[desk.id]) {
      const studentId = existingSeating[desk.id]!;
      newSeating[desk.id] = studentId;
      lockedStudentIds.add(studentId);
    } else if (respectFixedDesks && lockedDesks[desk.id]) {
      newSeating[desk.id] = null;
    } else {
      availableDesks.push(desk);
    }
  }

  // 4. Filter available students
  let studentsToPlace = students.filter(s => !lockedStudentIds.has(s.id));

  // If respectSpecialNeeds is enabled, students with special needs (front) can be placed in the frontmost available desks first
  let specialNeedsStudents: Student[] = [];
  if (respectSpecialNeeds) {
    specialNeedsStudents = studentsToPlace.filter(s => 
      (Array.isArray(s.specialNeeds) && s.specialNeeds.length > 0) ||
      s.visionNeeds === 'needs_front' ||
      s.hearingNeeds === 'needs_front' ||
      s.reducedMobility ||
      s.preferredRow === 'front'
    );
    const specialIds = new Set(specialNeedsStudents.map(s => s.id));
    studentsToPlace = studentsToPlace.filter(s => !specialIds.has(s.id));
  }

  // Helper to sort students
  const sortStudents = (list: Student[]) => {
    return [...list].sort((a, b) => {
      if (sortBy === 'rollNumber') {
        const numA = typeof a.rollNumber === 'number' ? a.rollNumber : 9999;
        const numB = typeof b.rollNumber === 'number' ? b.rollNumber : 9999;
        if (numA !== numB) {
          return sortOrder === 'desc' ? numB - numA : numA - numB;
        }
      }
      const comp = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
      return sortOrder === 'desc' ? -comp : comp;
    });
  };

  const sortedSpecial = sortStudents(specialNeedsStudents);
  const sortedGeneral = sortStudents(studentsToPlace);
  const finalOrderedStudents = [...sortedSpecial, ...sortedGeneral];

  // 5. Fill available desks
  let placedCount = lockedStudentIds.size;
  for (let i = 0; i < availableDesks.length; i++) {
    const desk = availableDesks[i];
    if (i < finalOrderedStudents.length) {
      newSeating[desk.id] = finalOrderedStudents[i].id;
      placedCount++;
    } else {
      newSeating[desk.id] = null;
    }
  }

  // 6. Generate diagnostic report
  const report = generateReport(newSeating, classroom, {
    mode: 'balanced',
    antiAffinityWeight: 8,
    affinityWeight: 8,
    specialNeedsWeight: 10,
    separateTalkativeWeight: 8,
    avoidIsolatedStudents: true,
    respectFixedDesks,
  });

  return {
    seatingMap: newSeating,
    report,
    placedCount,
    totalStudents: classroom.students.length,
  };
}

