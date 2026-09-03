import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Institution, AppUser, Classroom } from '../types';
import { INITIAL_INSTITUTIONS, INITIAL_USERS, INITIAL_CLASSROOMS } from '../utils/sampleData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

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
  CLASSROOMS: 'classrooms'
} as const;

// Helper to sanitize objects for Firestore (removes undefined values that crash Firestore)
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
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

      // Seed Classrooms
      for (const room of INITIAL_CLASSROOMS) {
        const docRef = doc(db, COLLECTIONS.CLASSROOMS, room.id);
        batch.set(docRef, sanitizeForFirestore(room));
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
          snapshot.forEach((d) => list.push(d.data() as Classroom));
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
    await setDoc(doc(db, COLLECTIONS.CLASSROOMS, classroom.id), sanitizeForFirestore(classroom), { merge: true });
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
      batch.set(doc(db, COLLECTIONS.CLASSROOMS, cls.id), sanitizeForFirestore(cls), { merge: true });
    }
    await batch.commit();
    console.log('✅ All local data successfully pushed to Firestore cloud.');
  } catch (e) {
    console.error('Error pushing all data to cloud:', e);
  }
}
