import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import type { JournalEntry, MoodLog, UserProfile, WeeklyReflection } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore targeting the specific provisioned database
export const db: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Authentication Helpers
export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const logoutUser = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj as T;
}

// User-Isolated Firestore Operations: /users/{userId}/entries/{entryId}
export const getEntriesCollectionRef = (userId: string) => {
  return collection(db, 'users', userId, 'entries');
};

export const getEntryDocRef = (userId: string, entryId: string) => {
  return doc(db, 'users', userId, 'entries', entryId);
};

export const saveJournalEntry = async (userId: string, entry: JournalEntry): Promise<void> => {
  if (!userId) throw new Error('User ID is required to persist journal entry.');
  const ref = getEntryDocRef(userId, entry.id);
  const cleanData = sanitizeForFirestore({
    ...entry,
    userId,
    updatedAt: Date.now(),
  });
  await setDoc(ref, cleanData, { merge: true });
};

export const deleteJournalEntry = async (userId: string, entryId: string): Promise<void> => {
  if (!userId || !entryId) return;
  const ref = getEntryDocRef(userId, entryId);
  await deleteDoc(ref);
};

export const subscribeToUserEntries = (
  userId: string, 
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (err: Error) => void
) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }
  const q = query(getEntriesCollectionRef(userId), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q, 
    (snapshot) => {
      const entries = snapshot.docs.map((docSnap) => docSnap.data() as JournalEntry);
      onUpdate(entries);
    },
    (error) => {
      console.error('Firestore entries subscription error:', error);
      if (onError) onError(error);
    }
  );
};

// Mood Logs Operations: /users/{userId}/moodLogs/{moodLogId}
export const getMoodLogsCollectionRef = (userId: string) => {
  return collection(db, 'users', userId, 'moodLogs');
};

export const saveMoodLog = async (userId: string, moodLog: MoodLog): Promise<void> => {
  if (!userId) throw new Error('User ID is required to record mood log.');
  const ref = doc(db, 'users', userId, 'moodLogs', moodLog.id);
  const clean = sanitizeForFirestore({
    ...moodLog,
    userId,
  });
  await setDoc(ref, clean, { merge: true });
};

export const subscribeToMoodLogs = (
  userId: string,
  onUpdate: (logs: MoodLog[]) => void,
  onError?: (err: Error) => void
) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }
  const q = query(getMoodLogsCollectionRef(userId), orderBy('createdAt', 'desc'), limit(30));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((docSnap) => docSnap.data() as MoodLog);
      onUpdate(logs);
    },
    (error) => {
      console.error('Firestore mood logs subscription error:', error);
      if (onError) onError(error);
    }
  );
};

// Weekly Reflection Operations: /users/{userId}/weeklyReflections/{reflectionId}
export const saveWeeklyReflection = async (userId: string, reflection: WeeklyReflection): Promise<void> => {
  if (!userId) throw new Error('User ID is required to persist weekly reflection.');
  const ref = doc(db, 'users', userId, 'weeklyReflections', reflection.id);
  const clean = sanitizeForFirestore({
    ...reflection,
    userId,
    savedAt: Date.now(),
  });
  await setDoc(ref, clean, { merge: true });
};

export const deleteWeeklyReflection = async (userId: string, reflectionId: string): Promise<void> => {
  if (!userId || !reflectionId) return;
  const ref = doc(db, 'users', userId, 'weeklyReflections', reflectionId);
  await deleteDoc(ref);
};

export const subscribeToWeeklyReflections = (
  userId: string,
  onUpdate: (reflections: WeeklyReflection[]) => void,
  onError?: (err: Error) => void
) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }
  const q = query(collection(db, 'users', userId, 'weeklyReflections'), orderBy('createdAt', 'desc'), limit(10));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as WeeklyReflection);
      onUpdate(list);
    },
    (error) => {
      console.error('Firestore weekly reflection error:', error);
      if (onError) onError(error);
    }
  );
};

// User Profile Operations: /users/{userId}
export const saveUserProfile = async (userId: string, profile: Partial<UserProfile>): Promise<void> => {
  if (!userId) return;
  const ref = doc(db, 'users', userId);
  const clean = sanitizeForFirestore(profile);
  await setDoc(ref, clean, { merge: true });
};

export const subscribeToUserProfile = (
  userId: string,
  onUpdate: (profile: UserProfile | null) => void,
  onError?: (err: Error) => void
) => {
  if (!userId) {
    onUpdate(null);
    return () => {};
  }
  const ref = doc(db, 'users', userId);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Firestore user profile subscription error:', error);
      if (onError) onError(error);
    }
  );
};
