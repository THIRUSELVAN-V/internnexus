import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const SERVER_APP_NAME = 'internnexus-server';

function getServerApp(): FirebaseApp {
  const existing = getApps().find((a) => a.name === SERVER_APP_NAME);
  if (existing) return existing;

  return initializeApp(
    {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCAf4QmB-Qj39PBfu6jybFPiFPFRkXiSPQ',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'internnexus-1.firebaseapp.com',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'internnexus-1',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'internnexus-1.firebasestorage.app',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '680019287642',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:680019287642:web:4b8ca740ff666b0e598263',
    },
    SERVER_APP_NAME
  );
}

/**
 * Runs a Firestore operation on the server side authenticated as the system service account.
 * This bypasses client-side auth permission limitations for public endpoints.
 */
export async function withServerDb<T>(callback: (db: Firestore) => Promise<T>): Promise<T> {
  const email = process.env.SYSTEM_SERVICE_EMAIL || 'internnexus_service_v3@internal.app';
  const password = process.env.SYSTEM_SERVICE_PASSWORD || 'InternNexus2026SecurePass';

  if (!email || !password) {
    throw new Error('System service credentials not configured in environment.');
  }

  const app = getServerApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (!auth.currentUser || auth.currentUser.email !== email) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  return await callback(db);
}
