'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './config';
import type { UserRole, UserProfile } from '@/lib/types';

// ─── Auth Actions ─────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<UserProfile> {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = credential;

  await updateProfile(user, { displayName });

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    displayName,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

export async function signIn(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
  } as UserProfile;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ─── Auth Observer ────────────────────────────────────────────────────────────

export function onAuthChange(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}
