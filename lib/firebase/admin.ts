import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";

import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  // Reuse the existing Firebase Admin app
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  // --------------------------------------------------
  // Validate Firebase Admin credentials
  // --------------------------------------------------

  if (!projectId) {
    throw new Error("FIREBASE_ADMIN_PROJECT_ID is not configured.");
  }

  if (!clientEmail) {
    throw new Error("FIREBASE_ADMIN_CLIENT_EMAIL is not configured.");
  }

  if (!privateKey) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is not configured.");
  }

  // --------------------------------------------------
  // Initialize Firebase Admin
  // --------------------------------------------------

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

// Create Firebase Admin app

const adminApp = getAdminApp();

// Firebase Authentication

export const adminAuth = getAuth(adminApp);

// Cloud Firestore

export const adminDb = getFirestore(adminApp);
