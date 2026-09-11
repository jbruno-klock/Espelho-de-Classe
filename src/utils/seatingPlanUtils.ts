import { Classroom, SavedSeatingPlan, SeatingPlanCategory } from '../types';

export const SEATING_PLAN_PRESETS: { name: string; category: SeatingPlanCategory; description: string }[] = [
  { name: 'Espelho Oficial', category: 'official', description: 'Distribuição padrão e contínua do dia a dia da turma' },
  { name: 'Ordem Alfabética', category: 'exam', description: 'Disposição organizada em ordem alfabética para provas e chamadas' },
  { name: 'Dias de Prova', category: 'exam', description: 'Distribuição intercalada para evitar cola e garantir silêncio' },
  { name: 'Teste / Simulado', category: 'test', description: 'Versão para avaliações parciais ou diagnósticas' },
  { name: 'Trabalho em Duplas', category: 'group', description: 'Organizado para colaboração e afinidades pedagógicas' },
  { name: 'Novo Espelho Personalizado', category: 'custom', description: 'Organização livre para projetos ou períodos específicos' },
];

/**
 * Ensures that a classroom always has a valid list of savedPlans and an activePlanId.
 * If empty, creates the initial "Espelho Oficial" based on current seatingMap.
 */
export function ensureClassroomPlans(classroom: Classroom): {
  plans: SavedSeatingPlan[];
  activePlan: SavedSeatingPlan;
  activePlanId: string;
} {
  let plans = Array.isArray(classroom.savedPlans) && classroom.savedPlans.length > 0 
    ? [...classroom.savedPlans] 
    : [];

  if (plans.length === 0) {
    const defaultPlan: SavedSeatingPlan = {
      id: `plan-default-${classroom.id}`,
      name: 'Espelho Oficial',
      category: 'official',
      description: 'Distribuição padrão de carteiras da turma',
      seatingMap: { ...(classroom.seatingMap || {}) },
      lockedDesks: { ...(classroom.lockedDesks || {}) },
      roomConfig: classroom.roomConfig ? JSON.parse(JSON.stringify(classroom.roomConfig)) : undefined,
      isDefault: true,
      createdAt: classroom.createdAt || Date.now(),
      updatedAt: classroom.updatedAt || Date.now(),
    };
    plans = [defaultPlan];
  }

  let activePlanId = classroom.activePlanId;
  let activePlan = plans.find(p => p.id === activePlanId);

  if (!activePlan) {
    activePlan = plans.find(p => p.isDefault) || plans[0];
    activePlanId = activePlan.id;
  }

  return { plans, activePlan, activePlanId };
}

/**
 * Syncs the current classroom seatingMap and lockedDesks into its active plan
 */
export function syncActivePlanWithClassroom(classroom: Classroom): Classroom {
  const { plans, activePlanId } = ensureClassroomPlans(classroom);
  const now = Date.now();

  const updatedPlans = plans.map(p => {
    if (p.id === activePlanId) {
      return {
        ...p,
        seatingMap: { ...(classroom.seatingMap || {}) },
        lockedDesks: { ...(classroom.lockedDesks || {}) },
        updatedAt: now,
      };
    }
    return p;
  });

  return {
    ...classroom,
    savedPlans: updatedPlans,
    activePlanId,
    updatedAt: now,
  };
}

/**
 * Switches the active plan of a classroom and loads its seatingMap and lockedDesks
 */
export function switchClassroomPlan(classroom: Classroom, targetPlanId: string): Classroom {
  const { plans } = ensureClassroomPlans(classroom);
  const target = plans.find(p => p.id === targetPlanId);
  if (!target) return classroom;

  return {
    ...classroom,
    activePlanId: target.id,
    seatingMap: { ...(target.seatingMap || {}) },
    lockedDesks: { ...(target.lockedDesks || {}) },
    roomConfig: target.roomConfig ? JSON.parse(JSON.stringify(target.roomConfig)) : classroom.roomConfig,
    updatedAt: Date.now(),
  };
}

/**
 * Creates and activates a new seating plan
 */
export function createNewSeatingPlan(
  classroom: Classroom, 
  name: string, 
  category: SeatingPlanCategory = 'custom',
  initialMode: 'copy_current' | 'blank' | 'clean_unlocked' = 'copy_current',
  description?: string
): { updatedClassroom: Classroom; newPlanId: string } {
  const { plans } = ensureClassroomPlans(classroom);
  const newPlanId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  let initialSeatingMap: Record<string, string | null> = {};
  let initialLockedDesks: Record<string, boolean> = {};

  if (initialMode === 'copy_current') {
    initialSeatingMap = { ...(classroom.seatingMap || {}) };
    initialLockedDesks = { ...(classroom.lockedDesks || {}) };
  } else if (initialMode === 'clean_unlocked') {
    initialLockedDesks = { ...(classroom.lockedDesks || {}) };
    // Keep only locked students
    Object.entries(classroom.seatingMap || {}).forEach(([deskId, studentId]) => {
      if (initialLockedDesks[deskId]) {
        initialSeatingMap[deskId] = studentId;
      }
    });
  } else {
    // blank
    initialSeatingMap = {};
    initialLockedDesks = {};
  }

  const newPlan: SavedSeatingPlan = {
    id: newPlanId,
    name: name.trim() || 'Novo Espelho',
    category,
    description: description?.trim() || undefined,
    seatingMap: initialSeatingMap,
    lockedDesks: initialLockedDesks,
    roomConfig: classroom.roomConfig ? JSON.parse(JSON.stringify(classroom.roomConfig)) : undefined,
    isDefault: plans.length === 0,
    createdAt: now,
    updatedAt: now,
  };

  const updatedPlans = [...plans, newPlan];

  const updatedClassroom: Classroom = {
    ...classroom,
    savedPlans: updatedPlans,
    activePlanId: newPlanId,
    seatingMap: initialSeatingMap,
    lockedDesks: initialLockedDesks,
    updatedAt: now,
  };

  return { updatedClassroom, newPlanId };
}

/**
 * Duplicates an existing plan
 */
export function duplicateSeatingPlan(classroom: Classroom, sourcePlanId: string, customName?: string): { updatedClassroom: Classroom; newPlanId: string } {
  const { plans } = ensureClassroomPlans(classroom);
  const source = plans.find(p => p.id === sourcePlanId) || plans[0];
  const newPlanId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const newPlan: SavedSeatingPlan = {
    ...source,
    id: newPlanId,
    name: customName?.trim() || `${source.name} (Cópia)`,
    isDefault: false,
    seatingMap: { ...(source.seatingMap || {}) },
    lockedDesks: { ...(source.lockedDesks || {}) },
    roomConfig: source.roomConfig ? JSON.parse(JSON.stringify(source.roomConfig)) : undefined,
    createdAt: now,
    updatedAt: now,
  };

  const updatedPlans = [...plans, newPlan];

  return {
    updatedClassroom: {
      ...classroom,
      savedPlans: updatedPlans,
      activePlanId: newPlanId,
      seatingMap: newPlan.seatingMap,
      lockedDesks: newPlan.lockedDesks,
      updatedAt: now,
    },
    newPlanId
  };
}

/**
 * Deletes a plan from classroom
 */
export function deleteSeatingPlan(classroom: Classroom, planIdToDelete: string): Classroom {
  const { plans, activePlanId } = ensureClassroomPlans(classroom);
  if (plans.length <= 1) {
    // Cannot delete the only remaining plan
    return classroom;
  }

  const updatedPlans = plans.filter(p => p.id !== planIdToDelete);
  let nextActiveId = activePlanId;
  let nextSeatingMap = classroom.seatingMap;
  let nextLockedDesks = classroom.lockedDesks;

  if (activePlanId === planIdToDelete) {
    const fallback = updatedPlans.find(p => p.isDefault) || updatedPlans[0];
    nextActiveId = fallback.id;
    nextSeatingMap = { ...(fallback.seatingMap || {}) };
    nextLockedDesks = { ...(fallback.lockedDesks || {}) };
  }

  return {
    ...classroom,
    savedPlans: updatedPlans,
    activePlanId: nextActiveId,
    seatingMap: nextSeatingMap,
    lockedDesks: nextLockedDesks,
    updatedAt: Date.now(),
  };
}

/**
 * Renames and updates metadata of a plan
 */
export function updateSeatingPlanMeta(
  classroom: Classroom, 
  planId: string, 
  updates: { name?: string; category?: SeatingPlanCategory; description?: string; isDefault?: boolean }
): Classroom {
  const { plans } = ensureClassroomPlans(classroom);
  const now = Date.now();

  const updatedPlans = plans.map(p => {
    if (p.id === planId) {
      return {
        ...p,
        name: updates.name?.trim() || p.name,
        category: updates.category || p.category,
        description: updates.description !== undefined ? updates.description.trim() : p.description,
        isDefault: updates.isDefault !== undefined ? updates.isDefault : p.isDefault,
        updatedAt: now,
      };
    }
    // If setting this plan as default, unset default from others
    if (updates.isDefault) {
      return { ...p, isDefault: false };
    }
    return p;
  });

  return {
    ...classroom,
    savedPlans: updatedPlans,
    updatedAt: now,
  };
}
