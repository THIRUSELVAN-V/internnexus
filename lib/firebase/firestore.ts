import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';

// ─── Collection References ────────────────────────────────────────────────────

export const collections = {
  users: 'users',
  companies: 'companies',
  internships: 'internships',
  applications: 'applications',
  mentorAssignments: 'mentorAssignments',
  tasks: 'tasks',
  submissions: 'submissions',
  feedback: 'feedback',
  certificates: 'certificates',
  notifications: 'notifications',
} as const;

// ─── Generic Helpers ──────────────────────────────────────────────────────────

export function convertTimestamp(data: DocumentData): DocumentData {
  const result: DocumentData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = convertTimestamp(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const db = getFirebaseDb();
  await setDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const db = getFirebaseDb();
  const docSnap = await getDoc(doc(db, collectionName, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as T;
}

export async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...convertTimestamp(d.data()),
  })) as T[];
}

export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, collectionName, id));
}

export function subscribeToDocument<T>(
  collectionName: string,
  id: string,
  callback: (data: T | null) => void
) {
  const db = getFirebaseDb();
  return onSnapshot(doc(db, collectionName, id), (snap) => {
    if (!snap.exists()) {
      callback(null);
    } else {
      callback({ id: snap.id, ...convertTimestamp(snap.data()) } as T);
    }
  });
}

export function subscribeToCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
) {
  const db = getFirebaseDb();
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((d) => ({
        id: d.id,
        ...convertTimestamp(d.data()),
      })) as T[]
    );
  });
}

// ─── Re-export query helpers ──────────────────────────────────────────────────

export { where, orderBy, limit };
