import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const SERVER_APP_NAME = 'internnexus-server';

function getServerApp(): FirebaseApp {
  const existing = getApps().find((a) => a.name === SERVER_APP_NAME);
  if (existing) return existing;

  return initializeApp(
    {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    SERVER_APP_NAME
  );
}

/**
 * Runs a Firestore operation on the server side authenticated as the system service account.
 * This bypasses client-side auth permission limitations for public endpoints.
 */
export async function withServerDb<T>(callback: (db: Firestore) => Promise<T>): Promise<T> {
  const email = process.env.SYSTEM_SERVICE_EMAIL;
  const password = process.env.SYSTEM_SERVICE_PASSWORD;

  if (!email || !password) {
    throw new Error('System service credentials not configured in environment.');
  }

  const app = getServerApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInWithEmailAndPassword(auth, email, password);
  try {
    return await callback(db);
  } finally {
    try {
      await signOut(auth);
    } catch {
      // Best-effort sign-out
    }
  }
}
