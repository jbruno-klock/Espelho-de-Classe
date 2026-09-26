import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Institution, AppUser, Classroom, Student, AttendanceRecord } from '../types';
import { INITIAL_INSTITUTIONS, INITIAL_USERS, INITIAL_CLASSROOMS } from '../utils/sampleData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with specific databaseId if configured
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined
);

// Collections
export const COLLECTIONS = {
  INSTITUTIONS: 'institutions',
  USERS: 'users',
  CLASSROOMS: 'classrooms',
  ATTENDANCE: 'attendance'
} as const;

/**
 * Automatically ensures silent anonymous authentication for public kiosk/NFC check-in.
 * Does not throw error if anonymous auth is not enabled in Firebase Console.
 */
export async function ensureAnonymousAuth(): Promise<void> {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log('✅ Autenticação anônima ativa para Check-in NFC');
    }
  } catch (error) {
    console.warn('Silent anonymous auth note (proceeding with public Firestore):', error);
  }
}

// Helper to sanitize objects for Firestore (removes undefined values that crash Firestore)
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Normalizes student properties to ensure both photoUrl and foto (as well as aliases) are consistent.
 */
export function normalizeStudent(student: Student): Student {
  const photo =
    (student as any).foto ||
    (student as any).photoUrl ||
    (student as any).avatar ||
    (student as any).image ||
    (student as any).photo ||
    (student as any).fotoUrl ||
    (student as any).imagem;

  if (photo && typeof photo === 'string' && photo.trim().length > 0) {
    const trimmed = photo.trim();
    return {
      ...student,
      photoUrl: trimmed,
      foto: trimmed,
    };
  }
  return student;
}

/**
 * Normalizes all students in a classroom.
 */
export function normalizeClassroom(classroom: Classroom): Classroom {
  return {
    ...classroom,
    students: (classroom.students || []).map(normalizeStudent),
  };
}

/**
 * Initializes Firestore default seed data if collections are empty.
 */
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    const instSnapshot = await getDocs(collection(db, COLLECTIONS.INSTITUTIONS));
    if (instSnapshot.empty) {
      console.log('🌱 Seeding initial institutions, users, and classrooms to Firestore...');
      const batch = writeBatch(db);

      // Seed Institutions
      for (const inst of INITIAL_INSTITUTIONS) {
        const docRef = doc(db, COLLECTIONS.INSTITUTIONS, inst.id);
        batch.set(docRef, sanitizeForFirestore(inst));
      }

      // Seed Users
      for (const user of INITIAL_USERS) {
        const docRef = doc(db, COLLECTIONS.USERS, user.id);
        batch.set(docRef, sanitizeForFirestore(user));
      }

      // Seed Classrooms with normalized student photos
      for (const room of INITIAL_CLASSROOMS) {
        const docRef = doc(db, COLLECTIONS.CLASSROOMS, room.id);
        batch.set(docRef, sanitizeForFirestore(normalizeClassroom(room)));
      }

      await batch.commit();
      console.log('✅ Firestore seed complete.');
    }
  } catch (error) {
    console.error('Error seeding initial Firestore data:', error);
  }
}

/**
 * Real-time listeners for all 3 collections.
 */
export function subscribeToCloudData(callbacks: {
  onInstitutions: (institutions: Institution[]) => void;
  onUsers: (users: AppUser[]) => void;
  onClassrooms: (classrooms: Classroom[]) => void;
  onError?: (err: unknown) => void;
}): () => void {
  const unsubs: Unsubscribe[] = [];

  try {
    // 1. Institutions Listener
    const unsubInst = onSnapshot(
      collection(db, COLLECTIONS.INSTITUTIONS),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Institution[] = [];
          snapshot.forEach((d) => list.push(d.data() as Institution));
          callbacks.onInstitutions(list);
        } else {
          // If empty, trigger seed
          seedInitialFirestoreData();
        }
      },
      (error) => {
        console.error('Institutions sync error:', error);
        callbacks.onError?.(error);
      }
    );
    unsubs.push(unsubInst);

    // 2. Users Listener
    const unsubUsers = onSnapshot(
      collection(db, COLLECTIONS.USERS),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AppUser[] = [];
          snapshot.forEach((d) => list.push(d.data() as AppUser));
          callbacks.onUsers(list);
        }
      },
      (error) => {
        console.error('Users sync error:', error);
        callbacks.onError?.(error);
      }
    );
    unsubs.push(unsubUsers);

    // 3. Classrooms Listener
    const unsubClassrooms = onSnapshot(
      collection(db, COLLECTIONS.CLASSROOMS),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Classroom[] = [];
          snapshot.forEach((d) => list.push(normalizeClassroom(d.data() as Classroom)));
          callbacks.onClassrooms(list);
        }
      },
      (error) => {
        console.error('Classrooms sync error:', error);
        callbacks.onError?.(error);
      }
    );
    unsubs.push(unsubClassrooms);
  } catch (err) {
    console.error('Failed to setup Firebase listeners:', err);
    callbacks.onError?.(err);
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}

// Cloud Mutation Operations
export async function syncInstitutionToCloud(inst: Institution): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.INSTITUTIONS, inst.id), sanitizeForFirestore(inst), { merge: true });
  } catch (e) {
    console.error('Error saving institution to cloud:', e);
  }
}

export async function deleteInstitutionFromCloud(instId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.INSTITUTIONS, instId));
  } catch (e) {
    console.error('Error deleting institution from cloud:', e);
  }
}

export async function syncUserToCloud(user: AppUser): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), sanitizeForFirestore(user), { merge: true });
  } catch (e) {
    console.error('Error saving user to cloud:', e);
  }
}

export async function deleteUserFromCloud(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  } catch (e) {
    console.error('Error deleting user from cloud:', e);
  }
}

export async function syncClassroomToCloud(classroom: Classroom): Promise<void> {
  try {
    const normalized = normalizeClassroom(classroom);
    await setDoc(doc(db, COLLECTIONS.CLASSROOMS, classroom.id), sanitizeForFirestore(normalized), { merge: true });
  } catch (e) {
    console.error('Error saving classroom to cloud:', e);
  }
}

export async function deleteClassroomFromCloud(classroomId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CLASSROOMS, classroomId));
  } catch (e) {
    console.error('Error deleting classroom from cloud:', e);
  }
}

export async function pushAllLocalDataToCloud(
  institutions: Institution[],
  users: AppUser[],
  classrooms: Classroom[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const inst of institutions) {
      batch.set(doc(db, COLLECTIONS.INSTITUTIONS, inst.id), sanitizeForFirestore(inst), { merge: true });
    }
    for (const user of users) {
      batch.set(doc(db, COLLECTIONS.USERS, user.id), sanitizeForFirestore(user), { merge: true });
    }
    for (const cls of classrooms) {
      batch.set(doc(db, COLLECTIONS.CLASSROOMS, cls.id), sanitizeForFirestore(normalizeClassroom(cls)), { merge: true });
    }
    await batch.commit();
    console.log('✅ All local data successfully pushed to Firestore cloud.');
  } catch (e) {
    console.error('Error pushing all data to cloud:', e);
  }
}

const ATTENDANCE_STORAGE_PREFIX = 'espelho_nfc_attendance_';

function getLocalAttendanceKey(institutionId: string): string {
  return `${ATTENDANCE_STORAGE_PREFIX}${institutionId}`;
}

export function getLocalAttendanceRecords(institutionId: string): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(getLocalAttendanceKey(institutionId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading local attendance records:', e);
  }
  return [];
}

export function saveLocalAttendanceRecord(record: AttendanceRecord): void {
  try {
    const current = getLocalAttendanceRecords(record.institutionId);
    const existingIndex = current.findIndex(r => r.id === record.id);
    let updated: AttendanceRecord[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = record;
    } else {
      updated = [record, ...current];
    }
    localStorage.setItem(getLocalAttendanceKey(record.institutionId), JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving local attendance record:', e);
  }
}

/**
 * Record attendance entry from NFC check-in.
 * If the student already checked in today (YYYY-MM-DD), the original entry time is preserved.
 */
export async function recordAttendanceEntry(entry: {
  institutionId: string;
  classroomId: string;
  classroomName: string;
  studentId: string;
  studentName: string;
  matricula: string;
  photoUrl?: string;
  foto?: string;
  date: string; // 'YYYY-MM-DD'
  entryTime: string; // 'HH:mm:ss'
  source?: 'nfc' | 'manual';
}): Promise<{
  success: boolean;
  isFirstToday: boolean;
  record: AttendanceRecord;
  originalTime?: string;
}> {
  const docId = `${entry.institutionId}_${entry.studentId}_${entry.date}`;

  // Ensure silent auth for attendance write if needed
  try {
    await ensureAnonymousAuth();
  } catch {
    // continue
  }

  // 1. Check local cache first
  const localList = getLocalAttendanceRecords(entry.institutionId);
  const existingLocal = localList.find(r => r.id === docId);

  try {
    // 2. Check cloud document in Firestore
    const docRef = doc(db, COLLECTIONS.ATTENDANCE, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const existingData = docSnap.data() as AttendanceRecord;
      saveLocalAttendanceRecord(existingData);
      return {
        success: true,
        isFirstToday: false,
        record: existingData,
        originalTime: existingData.entryTime || existingData.date
      };
    }

    if (existingLocal) {
      // Sync to cloud if locally found but not yet in firestore
      await setDoc(docRef, sanitizeForFirestore(existingLocal), { merge: true });
      return {
        success: true,
        isFirstToday: false,
        record: existingLocal,
        originalTime: existingLocal.entryTime
      };
    }

    // 3. New first-time attendance record for today!
    const photo = entry.photoUrl || entry.foto;
    const newRecord: AttendanceRecord = {
      id: docId,
      institutionId: entry.institutionId,
      classroomId: entry.classroomId,
      classroomName: entry.classroomName,
      studentId: entry.studentId,
      studentName: entry.studentName,
      matricula: entry.matricula,
      photoUrl: photo,
      foto: photo,
      date: entry.date,
      entryTime: entry.entryTime,
      timestamp: Date.now(),
      source: entry.source || 'nfc'
    };

    // Save in cloud
    await setDoc(docRef, sanitizeForFirestore(newRecord));
    // Save locally
    saveLocalAttendanceRecord(newRecord);

    return {
      success: true,
      isFirstToday: true,
      record: newRecord
    };
  } catch (error) {
    console.warn('Firestore attendance save warning, falling back to local storage:', error);

    // If offline or firestore error, ensure local persistence
    if (existingLocal) {
      return {
        success: true,
        isFirstToday: false,
        record: existingLocal,
        originalTime: existingLocal.entryTime
      };
    }

    const fallbackRecord: AttendanceRecord = {
      id: docId,
      institutionId: entry.institutionId,
      classroomId: entry.classroomId,
      classroomName: entry.classroomName,
      studentId: entry.studentId,
      studentName: entry.studentName,
      matricula: entry.matricula,
      date: entry.date,
      entryTime: entry.entryTime,
      timestamp: Date.now(),
      source: entry.source || 'nfc'
    };
    saveLocalAttendanceRecord(fallbackRecord);

    return {
      success: true,
      isFirstToday: true,
      record: fallbackRecord
    };
  }
}

/**
 * Remove an attendance record (e.g. if entered by mistake or canceled by teacher/coordination).
 */
export async function removeAttendanceRecord(
  institutionId: string,
  recordId: string
): Promise<boolean> {
  try {
    // 1. Remove from local storage cache
    const current = getLocalAttendanceRecords(institutionId);
    const updated = current.filter(r => r.id !== recordId);
    localStorage.setItem(getLocalAttendanceKey(institutionId), JSON.stringify(updated));

    // 2. Remove from Firestore
    try {
      await ensureAnonymousAuth();
      const docRef = doc(db, COLLECTIONS.ATTENDANCE, recordId);
      await deleteDoc(docRef);
    } catch (fsErr) {
      console.warn('Could not delete attendance record from Firestore, removed locally:', fsErr);
    }
    return true;
  } catch (err) {
    console.error('Error removing attendance record:', err);
    return false;
  }
}

/**
 * Real-time listener for attendance records in an institution.
 */
export function subscribeToAttendance(
  institutionId: string,
  onUpdate: (records: AttendanceRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  // First, provide cached records immediately for zero-delay UI
  const initialCached = getLocalAttendanceRecords(institutionId);
  if (initialCached.length > 0) {
    onUpdate(initialCached);
  }

  try {
    const unsub = onSnapshot(
      collection(db, COLLECTIONS.ATTENDANCE),
      (snapshot) => {
        const records: AttendanceRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as AttendanceRecord;
          if (data.institutionId === institutionId) {
            records.push(data);
          }
        });

        // Merge with local records
        const local = getLocalAttendanceRecords(institutionId);
        const map = new Map<string, AttendanceRecord>();
        local.forEach(r => map.set(r.id, r));
        records.forEach(r => map.set(r.id, r));
        const merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        localStorage.setItem(getLocalAttendanceKey(institutionId), JSON.stringify(merged));
        onUpdate(merged);
      },
      (error) => {
        console.warn('Realtime attendance sync warning:', error);
        onError?.(error);
      }
    );

    return unsub;
  } catch (err) {
    console.warn('Failed to attach attendance snapshot listener:', err);
    onError?.(err);
    return () => {};
  }
}
