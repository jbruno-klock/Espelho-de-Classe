import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Classroom, Student, StudentRelation, GenerationOptions, GenerationReport, RoomConfig, Institution, AppUser, SeatingPlanCategory, SavedSeatingPlan } from './types';
import { INITIAL_CLASSROOMS, INITIAL_INSTITUTIONS, INITIAL_USERS, createDefaultRoomConfig } from './utils/sampleData';
import { runSeatingOptimizer, generateReport } from './utils/algorithm';
import { exportClassroomToCSV, exportBackupJSON, exportToPdf } from './utils/exportUtils';
import {
  ensureClassroomPlans,
  syncActivePlanWithClassroom,
  switchClassroomPlan,
  createNewSeatingPlan,
  duplicateSeatingPlan,
  deleteSeatingPlan,
  updateSeatingPlanMeta,
} from './utils/seatingPlanUtils';
import {
  subscribeToCloudData,
  syncInstitutionToCloud,
  deleteInstitutionFromCloud,
  syncUserToCloud,
  deleteUserFromCloud,
  syncClassroomToCloud,
  deleteClassroomFromCloud,
  seedInitialFirestoreData,
  pushAllLocalDataToCloud,
} from './lib/firebase';

import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { SeatingGrid } from './components/SeatingGrid';
import { GeneratorControls } from './components/GeneratorControls';
import { SeatingPlanBar } from './components/SeatingPlanBar';
import { StudentDatabase } from './components/StudentDatabase';
import { PrintableExportView } from './components/PrintableExportView';
import { ClassModal } from './components/ClassModal';
import { DeleteClassModal } from './components/DeleteClassModal';
import { RoomConfigModal } from './components/RoomConfigModal';
import { StudentModal } from './components/StudentModal';
import { BatchImportModal } from './components/BatchImportModal';
import { AffinityMatrixModal } from './components/AffinityMatrixModal';
import { ConflictModal } from './components/ConflictModal';
import { MasterAdminDashboard } from './components/MasterAdminDashboard';
import { InstitutionModal } from './components/InstitutionModal';
import { UserModal } from './components/UserModal';
import { ClearMapModal } from './components/ClearMapModal';
import { ResetDataModal } from './components/ResetDataModal';

const STORAGE_KEY_CLASSROOMS = 'espelho_classe_data_v2';
const STORAGE_KEY_INSTITUTIONS = 'espelho_institutions_v2';
const STORAGE_KEY_USERS = 'espelho_users_v2';
const STORAGE_KEY_AUTH = 'espelho_current_user_v2';
const STORAGE_KEY_THEME = 'espelho_theme_v2';

export default function App() {
  // Theme State (Dark / Light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      console.error('Error loading theme:', e);
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 1. Institutions State
  const [institutions, setInstitutions] = useState<Institution[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INSTITUTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading institutions:', e);
    }
    return INITIAL_INSTITUTIONS;
  });

  // 2. Users State
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
    return INITIAL_USERS;
  });

  // 3. Current Authenticated User State (RBAC) - null means user is on Login Screen
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error('Error loading auth user:', e);
    }
    return null; // Start on Login Screen for password entry
  });

  // 4. Master Active Inspected Institution ID (allows Master to browse any school)
  const [masterSelectedInstitutionId, setMasterSelectedInstitutionId] = useState<string | null>(null);

  // 5. All Classrooms in database
  const [allClassrooms, setAllClassrooms] = useState<Classroom[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLASSROOMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(c => {
            const { plans, activePlanId } = ensureClassroomPlans(c);
            return { ...c, savedPlans: plans, activePlanId };
          });
        }
      }
    } catch (e) {
      console.error('Error loading classrooms:', e);
    }
    return INITIAL_CLASSROOMS.map(c => {
      const { plans, activePlanId } = ensureClassroomPlans(c);
      return { ...c, savedPlans: plans, activePlanId };
    });
  });

  // Cloud Sync Status
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const isInitialCloudSyncRef = useRef<boolean>(true);

  // Feedback for Seating Plan actions
  const [planFeedback, setPlanFeedback] = useState<string | null>(null);

  // Firebase Real-time Listener Connection
  useEffect(() => {
    // Seed initial data if database is fresh
    seedInitialFirestoreData();

    const unsubscribe = subscribeToCloudData({
      onInstitutions: (cloudInstitutions) => {
        if (cloudInstitutions && cloudInstitutions.length > 0) {
          setInstitutions(cloudInstitutions);
        }
      },
      onUsers: (cloudUsers) => {
        if (cloudUsers && cloudUsers.length > 0) {
          setUsers(cloudUsers);
          // If current user is logged in, sync their state
          setCurrentUser(prev => {
            if (!prev) return null;
            const updated = cloudUsers.find(u => u.id === prev.id);
            return updated || prev;
          });
        }
      },
      onClassrooms: (cloudClassrooms) => {
        if (cloudClassrooms && cloudClassrooms.length > 0) {
          const initialized = cloudClassrooms.map(c => {
            const { plans, activePlanId } = ensureClassroomPlans(c);
            return { ...c, savedPlans: plans, activePlanId };
          });
          setAllClassrooms(initialized);
        }
        setIsCloudSynced(true);
      },
      onError: (err) => {
        console.warn('Realtime cloud sync error:', err);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 6. Multi-Tenant Data Isolation Logic
  const effectiveInstitutionId = currentUser?.role === 'manager'
    ? currentUser.institutionId
    : (masterSelectedInstitutionId || institutions[0]?.id);

  const activeInstitution = institutions.find(i => i.id === effectiveInstitutionId);

  // Filter classrooms by institution for tenant isolation
  const visibleClassrooms = allClassrooms.filter(c => {
    if (!c.institutionId) {
      // Legacy backwards compatibility: assign to first institution
      return effectiveInstitutionId === institutions[0]?.id;
    }
    return c.institutionId === effectiveInstitutionId;
  });

  const [activeClassroomId, setActiveClassroomId] = useState<string>(() => {
    return visibleClassrooms[0]?.id || 'class-default';
  });

  // Active classroom instance
  const activeClassroom = visibleClassrooms.find(c => c.id === activeClassroomId) || visibleClassrooms[0] || {
    id: `class-empty-${Date.now()}`,
    institutionId: effectiveInstitutionId,
    name: 'Turma Inicial',
    grade: 'Ensino Fundamental II',
    schoolName: activeInstitution?.name || 'Escola',
    teacherName: 'Prof. Titular',
    academicYear: '2026',
    roomConfig: createDefaultRoomConfig(5, 6, 'rows'),
    students: [],
    seatingMap: {},
    lockedDesks: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Sync activeClassroomId when institution changes or list changes
  useEffect(() => {
    if (visibleClassrooms.length > 0) {
      if (!visibleClassrooms.some(c => c.id === activeClassroomId)) {
        setActiveClassroomId(visibleClassrooms[0].id);
      }
    }
  }, [effectiveInstitutionId, visibleClassrooms, activeClassroomId]);

  const [activeTab, setActiveTab] = useState<'map' | 'students' | 'matrix' | 'print' | 'master_admin'>('map');
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [isDeleteClassModalOpen, setIsDeleteClassModalOpen] = useState(false);
  const [isRoomConfigModalOpen, setIsRoomConfigModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);
  const [isAffinityMatrixModalOpen, setIsAffinityMatrixModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Institution and User Modals for Master
  const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Clear Map and Reset Data Modals (Replaces window.confirm for iframe reliability)
  const [isClearMapModalOpen, setIsClearMapModalOpen] = useState(false);
  const [isResetDataModalOpen, setIsResetDataModalOpen] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLASSROOMS, JSON.stringify(allClassrooms));
    } catch (e) {
      console.error('Error saving classrooms:', e);
    }
  }, [allClassrooms]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INSTITUTIONS, JSON.stringify(institutions));
    } catch (e) {
      console.error('Error saving institutions:', e);
    }
  }, [institutions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH);
      }
    } catch (e) {
      console.error('Error saving auth user:', e);
    }
  }, [currentUser]);

  // Current generation report
  const currentReport: GenerationReport | null = React.useMemo(() => {
    if (!activeClassroom || Object.keys(activeClassroom.seatingMap || {}).length === 0) {
      return null;
    }
    return generateReport(activeClassroom.seatingMap, activeClassroom, {
      mode: 'balanced',
      antiAffinityWeight: 9,
      affinityWeight: 7,
      specialNeedsWeight: 10,
      separateTalkativeWeight: 8,
      avoidIsolatedStudents: true,
      respectFixedDesks: true,
    });
  }, [activeClassroom]);

  // Helper to update active classroom and sync to Cloud
  const updateActiveClassroom = (updater: (prev: Classroom) => Classroom) => {
    setAllClassrooms(prev =>
      prev.map(cls => {
        if (cls.id === activeClassroom.id) {
          const updated = updater(cls);
          const withSyncedPlan = syncActivePlanWithClassroom(updated);
          syncClassroomToCloud(withSyncedPlan);
          return withSyncedPlan;
        }
        return cls;
      })
    );
  };

  // Seating Plan Handlers (Espelhos múltiplos por turma)
  const handleSwitchPlan = (planId: string) => {
    setAllClassrooms(prev =>
      prev.map(cls => {
        if (cls.id === activeClassroom.id) {
          // Sync current changes before switching
          const synced = syncActivePlanWithClassroom(cls);
          const switched = switchClassroomPlan(synced, planId);
          syncClassroomToCloud(switched);
          return switched;
        }
        return cls;
      })
    );
    const targetPlan = activeClassroom.savedPlans?.find(p => p.id === planId);
    setPlanFeedback(`Espelho "${targetPlan?.name || 'selecionado'}" ativado`);
    setTimeout(() => setPlanFeedback(null), 3000);
  };

  const handleCreatePlan = (
    name: string,
    category: SeatingPlanCategory,
    initialMode: 'copy_current' | 'blank' | 'clean_unlocked',
    description?: string
  ) => {
    setAllClassrooms(prev =>
      prev.map(cls => {
        if (cls.id === activeClassroom.id) {
          const synced = syncActivePlanWithClassroom(cls);
          const { updatedClassroom } = createNewSeatingPlan(synced, name, category, initialMode, description);
          syncClassroomToCloud(updatedClassroom);
          return updatedClassroom;
        }
        return cls;
      })
    );
    setPlanFeedback(`Espelho "${name}" criado com sucesso!`);
    setTimeout(() => setPlanFeedback(null), 3500);
  };

  const handleDuplicatePlan = (planId: string, customName?: string) => {
    setAllClassrooms(prev =>
      prev.map(cls => {
        if (cls.id === activeClassroom.id) {
          const synced = syncActivePlanWithClassroom(cls);
          const { updatedClassroom } = duplicateSeatingPlan(synced, planId, customName);
          syncClassroomToCloud(updatedClassroom);
          return updatedClassroom;
        }
        return cls;
      })
    );
    setPlanFeedback('Espelho duplicado com sucesso!');
    setTimeout(() => setPlanFeedback(null), 3500);
  };

  const handleRenamePlan = (planId: string, newName: string, category?: SeatingPlanCategory, description?: string) => {
    setAllClassrooms(prev =>
      prev.map(cls => {
        if (cls.id === activeClassroom.id) {
          const updated = updateSeatingPlanMeta(cls, planId, { name: newName, category, description });
          syncClassroomToCloud(updated);
          return updated;
        }
        return cls;
      })
    );
    setPlanFeedback('Espelho atualizado com sucesso');
    setTimeout(() => setPlanFeedback(null), 3000);
  };

  const handleDeletePlan = (planId: string) => {
    setAllClassrooms(prev =>
      prev.map(cls => {
        if (cls.id === activeClassroom.id) {
          const updated = deleteSeatingPlan(cls, planId);
          syncClassroomToCloud(updated);
          return updated;
        }
        return cls;
      })
    );
    setPlanFeedback('Espelho excluído');
    setTimeout(() => setPlanFeedback(null), 3000);
  };

  const handleSetDefaultPlan = (planId: string) => {
    setAllClassrooms(prev =>
      prev.map(cls => {
        if (cls.id === activeClassroom.id) {
          const updated = updateSeatingPlanMeta(cls, planId, { isDefault: true });
          syncClassroomToCloud(updated);
          return updated;
        }
        return cls;
      })
    );
    setPlanFeedback('Definido como Espelho Oficial da turma');
    setTimeout(() => setPlanFeedback(null), 3000);
  };

  const handleSaveCurrentSnapshot = () => {
    setAllClassrooms(prev =>
      prev.map(cls => {
        if (cls.id === activeClassroom.id) {
          const updated = syncActivePlanWithClassroom(cls);
          syncClassroomToCloud(updated);
          return updated;
        }
        return cls;
      })
    );
    setPlanFeedback('Espelho salvo com sucesso!');
    setTimeout(() => setPlanFeedback(null), 3500);
  };

  // Run Optimizer Engine
  const handleRunGenerator = (options: GenerationOptions) => {
    if (!activeClassroom || activeClassroom.students.length === 0) return;

    setIsGenerating(true);

    setTimeout(() => {
      try {
        const { seatingMap, report } = runSeatingOptimizer(activeClassroom, options);

        updateActiveClassroom(prev => ({
          ...prev,
          seatingMap,
          updatedAt: Date.now(),
        }));

        if (report.score >= 85) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        console.error('Generator error:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 400);
  };

  // Manual Desk Actions
  const handleSwapDesks = (deskId1: string, deskId2: string) => {
    updateActiveClassroom(prev => {
      const newMap = { ...prev.seatingMap };
      const temp = newMap[deskId1] || null;
      newMap[deskId1] = newMap[deskId2] || null;
      newMap[deskId2] = temp;
      return { ...prev, seatingMap: newMap, updatedAt: Date.now() };
    });
  };

  const handleAssignStudentToDesk = (studentId: string, deskId: string) => {
    updateActiveClassroom(prev => {
      const newMap = { ...prev.seatingMap };
      Object.keys(newMap).forEach(key => {
        if (newMap[key] === studentId) newMap[key] = null;
      });
      newMap[deskId] = studentId;
      return { ...prev, seatingMap: newMap, updatedAt: Date.now() };
    });
  };

  const handleRemoveStudentFromDesk = (deskId: string) => {
    updateActiveClassroom(prev => {
      const newMap = { ...prev.seatingMap };
      newMap[deskId] = null;
      return { ...prev, seatingMap: newMap, updatedAt: Date.now() };
    });
  };

  const handleToggleLockDesk = (deskId: string) => {
    updateActiveClassroom(prev => {
      const newLocked = { ...prev.lockedDesks };
      newLocked[deskId] = !newLocked[deskId];
      return { ...prev, lockedDesks: newLocked, updatedAt: Date.now() };
    });
  };

  const handleClearSeating = () => {
    setIsClearMapModalOpen(true);
  };

  const handleConfirmClearMap = (mode: 'unlocked_only' | 'all') => {
    updateActiveClassroom(prev => {
      const rows = prev.roomConfig?.rows || 6;
      const cols = prev.roomConfig?.cols || 6;
      const clearedMap: Record<string, string | null> = {};
      const newLocked: Record<string, boolean> = mode === 'all' ? {} : { ...(prev.lockedDesks || {}) };

      // Initialize all coordinate desks explicitly
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const deskId = `r${r}_c${c}`;
          if (mode === 'unlocked_only' && prev.lockedDesks?.[deskId] && prev.seatingMap?.[deskId]) {
            clearedMap[deskId] = prev.seatingMap[deskId];
          } else {
            clearedMap[deskId] = null;
          }
        }
      }

      // Also account for any custom or legacy keys
      Object.keys(prev.seatingMap || {}).forEach(key => {
        if (mode === 'unlocked_only' && prev.lockedDesks?.[key] && prev.seatingMap?.[key]) {
          clearedMap[key] = prev.seatingMap[key];
        } else {
          clearedMap[key] = null;
        }
      });

      return {
        ...prev,
        seatingMap: clearedMap,
        lockedDesks: newLocked,
        updatedAt: Date.now(),
      };
    });

    setIsClearMapModalOpen(false);
    setPlanFeedback(
      mode === 'all'
        ? 'Mapa de carteiras completamente esvaziado!'
        : 'Carteiras livres esvaziadas (fixas preservadas)'
    );
    setTimeout(() => setPlanFeedback(null), 3500);
  };

  // Student CRUD
  const handleSaveStudent = (student: Student) => {
    updateActiveClassroom(prev => {
      const exists = prev.students.some(s => s.id === student.id);
      let updatedStudents: Student[];
      if (exists) {
        updatedStudents = prev.students.map(s => (s.id === student.id ? student : s));
      } else {
        updatedStudents = [...prev.students, student];
      }
      return { ...prev, students: updatedStudents, updatedAt: Date.now() };
    });
    setIsStudentModalOpen(false);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (studentId: string) => {
    updateActiveClassroom(prev => {
      const updatedStudents = prev.students.filter(s => s.id !== studentId);
      const updatedMap = { ...prev.seatingMap };
      Object.keys(updatedMap).forEach(deskId => {
        if (updatedMap[deskId] === studentId) updatedMap[deskId] = null;
      });
      return { ...prev, students: updatedStudents, seatingMap: updatedMap, updatedAt: Date.now() };
    });
  };

  const handleBatchImport = (importedStudents: Student[]) => {
    updateActiveClassroom(prev => {
      return {
        ...prev,
        students: [...prev.students, ...importedStudents],
        updatedAt: Date.now(),
      };
    });
    setIsBatchImportModalOpen(false);
  };

  // Room Config
  const handleSaveRoomConfig = (newConfig: RoomConfig) => {
    updateActiveClassroom(prev => {
      const cleanedMap: Record<string, string | null> = {};
      Object.keys(newConfig.activeDesks).forEach(deskId => {
        if (newConfig.activeDesks[deskId]) {
          cleanedMap[deskId] = prev.seatingMap[deskId] || null;
        }
      });
      return { ...prev, roomConfig: newConfig, seatingMap: cleanedMap, updatedAt: Date.now() };
    });
    setIsRoomConfigModalOpen(false);
  };

  // Classroom CRUD
  const handleSaveClassroom = (classroomToSave: Classroom) => {
    // Ensure classroom is bound to the active tenant institution
    const withInstitution: Classroom = {
      ...classroomToSave,
      institutionId: classroomToSave.institutionId || effectiveInstitutionId,
      schoolName: activeInstitution?.name || classroomToSave.schoolName,
      updatedAt: Date.now(),
    };

    setAllClassrooms(prev => {
      const exists = prev.some(c => c.id === withInstitution.id);
      if (exists) {
        return prev.map(c => (c.id === withInstitution.id ? withInstitution : c));
      }
      return [...prev, withInstitution];
    });

    // Cloud Sync
    syncClassroomToCloud(withInstitution);

    setActiveClassroomId(withInstitution.id);
    setIsClassModalOpen(false);
    setEditingClassroom(null);
  };

  const handleDeleteClassroom = (classroomId: string) => {
    setAllClassrooms(prev => {
      const remaining = prev.filter(c => c.id !== classroomId);
      return remaining;
    });

    // Cloud Delete
    deleteClassroomFromCloud(classroomId);

    setIsDeleteClassModalOpen(false);
    setIsClassModalOpen(false);
  };

  // Affinity Matrix Handlers
  const handleUpdateStudentRelations = (
    studentId: string,
    affinities: string[],
    antiAffinities: string[],
    affinityDetails?: StudentRelation[],
    antiAffinityDetails?: StudentRelation[]
  ) => {
    updateActiveClassroom(prev => {
      const updatedStudents = prev.students.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            affinities,
            antiAffinities,
            affinityDetails: affinityDetails || s.affinityDetails,
            antiAffinityDetails: antiAffinityDetails || s.antiAffinityDetails,
          };
        }
        return s;
      });
      return { ...prev, students: updatedStudents, updatedAt: Date.now() };
    });
  };

  const handleAddCustomCategory = (category: string, type: 'affinity' | 'antiAffinity') => {
    updateActiveClassroom(prev => {
      if (type === 'affinity') {
        const existing = prev.customAffinityCategories || [];
        if (existing.includes(category)) return prev;
        return { ...prev, customAffinityCategories: [...existing, category], updatedAt: Date.now() };
      } else {
        const existing = prev.customAntiAffinityCategories || [];
        if (existing.includes(category)) return prev;
        return { ...prev, customAntiAffinityCategories: [...existing, category], updatedAt: Date.now() };
      }
    });
  };

  // Master Admin Handlers
  const handleSaveInstitution = (institution: Institution) => {
    setInstitutions(prev => {
      const exists = prev.some(i => i.id === institution.id);
      if (exists) {
        return prev.map(i => (i.id === institution.id ? institution : i));
      }
      return [...prev, institution];
    });

    // Cloud Sync
    syncInstitutionToCloud(institution);
  };

  const handleDeleteInstitution = (institutionId: string) => {
    setInstitutions(prev => {
      const remaining = prev.filter(i => i.id !== institutionId);
      return remaining;
    });

    deleteInstitutionFromCloud(institutionId);

    setAllClassrooms(prev => {
      const remaining = prev.filter(c => c.institutionId !== institutionId);
      if (activeClassroom?.institutionId === institutionId) {
        if (remaining.length > 0) {
          setActiveClassroomId(remaining[0].id);
        }
      }
      return remaining;
    });

    setUsers(prev => prev.map(u => (u.institutionId === institutionId ? { ...u, institutionId: undefined, isActive: false } : u)));

    if (masterSelectedInstitutionId === institutionId) {
      setMasterSelectedInstitutionId(null);
    }
  };

  const handleSaveUser = (user: AppUser) => {
    setUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) {
        return prev.map(u => (u.id === user.id ? user : u));
      }
      return [...prev, user];
    });

    // Cloud Sync
    syncUserToCloud(user);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    deleteUserFromCloud(userId);

    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
  };

  const handleSwitchSimulatedUser = (targetUser: AppUser) => {
    if (currentUser?.role !== 'master') return;
    setCurrentUser(targetUser);
    if (targetUser.role === 'manager' && targetUser.institutionId) {
      setMasterSelectedInstitutionId(targetUser.institutionId);
      setActiveTab('map');
    }
  };

  const handleEnterInstitutionAsMaster = (instId: string) => {
    setMasterSelectedInstitutionId(instId);
    setActiveTab('map');
  };

  const handleEnterClassroomAsMaster = (instId: string, classroomId: string) => {
    setMasterSelectedInstitutionId(instId);
    setActiveClassroomId(classroomId);
    setActiveTab('map');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Reset to initial sample data
  const handleResetToSample = () => {
    setIsResetDataModalOpen(true);
  };

  const handleConfirmResetToSample = async () => {
    setInstitutions(INITIAL_INSTITUTIONS);
    setUsers(INITIAL_USERS);
    setAllClassrooms(INITIAL_CLASSROOMS);
    setCurrentUser(INITIAL_USERS[0]);
    setMasterSelectedInstitutionId(INITIAL_INSTITUTIONS[0].id);
    setActiveClassroomId(INITIAL_CLASSROOMS[0].id);
    localStorage.removeItem(STORAGE_KEY_CLASSROOMS);
    localStorage.removeItem(STORAGE_KEY_INSTITUTIONS);
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_AUTH);
    await pushAllLocalDataToCloud(INITIAL_INSTITUTIONS, INITIAL_USERS, INITIAL_CLASSROOMS);
    setPlanFeedback('Dados de exemplo restaurados com sucesso!');
    setTimeout(() => setPlanFeedback(null), 3500);
  };

  // Force push all local state to Cloud
  const handleForceSync = async () => {
    await pushAllLocalDataToCloud(institutions, users, allClassrooms);
  };

  // PDF Export
  const handleExportPDF = async () => {
    setActiveTab('print');
    setTimeout(async () => {
      if (activeClassroom) {
        await exportToPdf(
          'printable-document-content', 
          `espelho_classe_${activeClassroom.name.replace(/[\s/]/g, '_')}`,
          activeClassroom,
          activeInstitution
        );
      }
    }, 350);
  };

  // If no user is logged in, show Login Screen with Password Authentication
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(authenticatedUser) => {
          setCurrentUser(authenticatedUser);
          if (authenticatedUser.role === 'manager' && authenticatedUser.institutionId) {
            setMasterSelectedInstitutionId(authenticatedUser.institutionId);
          }
        }}
        users={users}
        institutions={institutions}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const isMaster = currentUser.role === 'master';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0a0a0c] text-slate-900 dark:text-[#e2e2e8] flex flex-col selection:bg-emerald-600 selection:text-white transition-colors">
      
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeInstitution={activeInstitution}
        allInstitutions={institutions}
        allUsers={users}
        classrooms={visibleClassrooms}
        activeClassroom={activeClassroom}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSelectClassroom={(id) => setActiveClassroomId(id)}
        onOpenNewClassModal={() => {
          setEditingClassroom(null);
          setIsClassModalOpen(true);
        }}
        onOpenEditClassModal={() => {
          setEditingClassroom(activeClassroom);
          setIsClassModalOpen(true);
        }}
        onOpenDeleteClassModal={() => setIsDeleteClassModalOpen(true)}
        onOpenRoomConfigModal={() => setIsRoomConfigModalOpen(true)}
        onOpenStudentListModal={() => setActiveTab('students')}
        onOpenAffinityMatrixModal={() => setIsAffinityMatrixModalOpen(true)}
        onOpenBatchImportModal={() => setIsBatchImportModalOpen(true)}
        onPrintPreview={() => setActiveTab('print')}
        onExportPDF={handleExportPDF}
        onExportBackup={() => exportBackupJSON(allClassrooms)}
        onImportBackup={async (data) => {
          setAllClassrooms(data);
          if (data[0]) setActiveClassroomId(data[0].id);
          await pushAllLocalDataToCloud(institutions, users, data);
        }}
        onResetToSample={handleResetToSample}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchSimulatedUser={handleSwitchSimulatedUser}
        onForceSync={handleForceSync}
        onOpenInstitutionSettings={isMaster ? () => {
          setEditingInstitution(activeInstitution || null);
          setIsInstitutionModalOpen(true);
        } : undefined}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* VIEW: MASTER ADMIN DASHBOARD */}
        {activeTab === 'master_admin' && currentUser.role === 'master' && (
          <MasterAdminDashboard
            currentUser={currentUser}
            institutions={institutions}
            users={users}
            classrooms={allClassrooms}
            onAddInstitution={() => {
              setEditingInstitution(null);
              setIsInstitutionModalOpen(true);
            }}
            onEditInstitution={(inst) => {
              setEditingInstitution(inst);
              setIsInstitutionModalOpen(true);
            }}
            onDeleteInstitution={handleDeleteInstitution}
            onAddUser={() => {
              setEditingUser(null);
              setIsUserModalOpen(true);
            }}
            onEditUser={(u) => {
              setEditingUser(u);
              setIsUserModalOpen(true);
            }}
            onDeleteUser={handleDeleteUser}
            onSwitchSimulatedUser={handleSwitchSimulatedUser}
            onEnterInstitutionAsMaster={handleEnterInstitutionAsMaster}
            onEnterClassroomAsMaster={handleEnterClassroomAsMaster}
          />
        )}

        {/* VIEW: INTERACTIVE SEATING MAP */}
        {activeTab === 'map' && (
          <div className="w-full px-2 sm:px-4 lg:px-6 py-3 space-y-4">
            {/* Seating Plan Selector & Management Bar (Múltiplos Espelhos) */}
            <SeatingPlanBar
              classroom={activeClassroom}
              onSwitchPlan={handleSwitchPlan}
              onCreatePlan={handleCreatePlan}
              onDuplicatePlan={handleDuplicatePlan}
              onRenamePlan={handleRenamePlan}
              onDeletePlan={handleDeletePlan}
              onSetDefaultPlan={handleSetDefaultPlan}
              onSaveCurrentSnapshot={handleSaveCurrentSnapshot}
              saveFeedback={planFeedback}
            />

            <GeneratorControls
              classroom={activeClassroom}
              report={currentReport}
              onRunGenerator={handleRunGenerator}
              onClearSeating={handleClearSeating}
              isGenerating={isGenerating}
              onOpenConflictModal={() => setIsConflictModalOpen(true)}
            />

            <SeatingGrid
              classroom={activeClassroom}
              onSwapDesks={handleSwapDesks}
              onAssignStudentToDesk={handleAssignStudentToDesk}
              onRemoveStudentFromDesk={handleRemoveStudentFromDesk}
              onToggleLockDesk={handleToggleLockDesk}
              onSelectStudent={(student) => {
                setEditingStudent(student);
                setIsStudentModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW: STUDENT DATABASE */}
        {activeTab === 'students' && (
          <StudentDatabase
            classroom={activeClassroom}
            onOpenAddStudentModal={() => {
              setEditingStudent(null);
              setIsStudentModalOpen(true);
            }}
            onOpenEditStudentModal={(student) => {
              setEditingStudent(student);
              setIsStudentModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
            onOpenBatchImportModal={() => setIsBatchImportModalOpen(true)}
          />
        )}

        {/* VIEW: AFFINITY MATRIX */}
        {activeTab === 'matrix' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white dark:bg-[#121216] rounded-3xl p-6 border border-slate-200 dark:border-zinc-800/80 shadow-xs mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 font-display">
                Mapa de Relações Sociais & Afinidades
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                Ajuste facilmente quem tem afinidade ou conflito com outros colegas na turma <strong className="text-slate-900 dark:text-zinc-200">{activeClassroom.name}</strong> ({activeInstitution?.name}).
              </p>
            </div>
            
            <div className="bg-white dark:bg-[#121216] rounded-3xl border border-slate-200 dark:border-zinc-800/80 p-6 shadow-xs">
              <button
                onClick={() => setIsAffinityMatrixModalOpen(true)}
                className="w-full py-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-500/30 rounded-2xl text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                Abrir Editor Completo da Matriz de Afinidades
              </button>
            </div>
          </div>
        )}

        {/* VIEW: PRINTABLE VIEW */}
        {activeTab === 'print' && (
          <PrintableExportView
            classroom={activeClassroom}
            institution={activeInstitution}
            onBackToEditor={() => setActiveTab('map')}
            onSwitchPlan={handleSwitchPlan}
            onOpenInstitutionSettings={isMaster ? () => {
              setEditingInstitution(activeInstitution || null);
              setIsInstitutionModalOpen(true);
            } : undefined}
          />
        )}
      </main>

      {/* Modals */}
      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => {
          setIsClassModalOpen(false);
          setEditingClassroom(null);
        }}
        onSaveClassroom={handleSaveClassroom}
        onDeleteClassroom={handleDeleteClassroom}
        initialClassroom={editingClassroom}
        currentInstitutionId={effectiveInstitutionId}
      />

      <DeleteClassModal
        isOpen={isDeleteClassModalOpen}
        onClose={() => setIsDeleteClassModalOpen(false)}
        classroom={activeClassroom}
        totalClassrooms={visibleClassrooms.length}
        onConfirmDelete={handleDeleteClassroom}
      />

      <RoomConfigModal
        isOpen={isRoomConfigModalOpen}
        onClose={() => setIsRoomConfigModalOpen(false)}
        classroom={activeClassroom}
        onSaveConfig={handleSaveRoomConfig}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
        onSaveStudent={handleSaveStudent}
        allStudents={activeClassroom.students}
        initialStudent={editingStudent}
        customCategories={[
          ...(activeClassroom.customAffinityCategories || []),
          ...(activeClassroom.customAntiAffinityCategories || [])
        ]}
      />

      <BatchImportModal
        isOpen={isBatchImportModalOpen}
        onClose={() => setIsBatchImportModalOpen(false)}
        onImportStudents={handleBatchImport}
        existingStudents={activeClassroom.students}
        existingCount={activeClassroom.students.length}
      />

      <AffinityMatrixModal
        isOpen={isAffinityMatrixModalOpen}
        onClose={() => setIsAffinityMatrixModalOpen(false)}
        classroom={activeClassroom}
        onUpdateStudentRelations={handleUpdateStudentRelations}
        onAddCustomCategory={handleAddCustomCategory}
      />

      <ConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        classroom={activeClassroom}
        conflicts={currentReport?.conflicts || []}
        onSwapDesks={handleSwapDesks}
      />

      {/* Master Modals */}
      <InstitutionModal
        isOpen={isInstitutionModalOpen}
        onClose={() => {
          setIsInstitutionModalOpen(false);
          setEditingInstitution(null);
        }}
        onSave={handleSaveInstitution}
        onDelete={handleDeleteInstitution}
        initialData={editingInstitution}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
        institutions={institutions}
        initialData={editingUser}
      />

      {/* Clear Map Confirmation Modal */}
      <ClearMapModal
        isOpen={isClearMapModalOpen}
        onClose={() => setIsClearMapModalOpen(false)}
        classroom={activeClassroom}
        activePlanName={activeClassroom.savedPlans?.find(p => p.id === activeClassroom.activePlanId)?.name || 'Espelho Oficial'}
        onConfirmClear={handleConfirmClearMap}
      />

      {/* Reset Data Confirmation Modal */}
      <ResetDataModal
        isOpen={isResetDataModalOpen}
        onClose={() => setIsResetDataModalOpen(false)}
        onConfirmReset={handleConfirmResetToSample}
      />

    </div>
  );
}
