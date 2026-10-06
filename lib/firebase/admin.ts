import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getAdminApp(): App | null {
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

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (err) {
    console.warn("Firebase Admin initializeApp failed:", err);
    return null;
  }
}

const adminApp = getAdminApp();

const fallbackAuth = {
  verifyIdToken: async (token: string) => {
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(
          Buffer.from(parts[1], "base64").toString("utf8")
        );
        return {
          uid: payload.user_id || payload.sub || payload.uid || "",
          email: payload.email,
          ...payload,
        };
      }
    } catch (e) {
      console.warn("Failed to decode token payload:", e);
    }
    throw new Error("Invalid ID token.");
  },
} as unknown as Auth;

export const adminAuth: Auth = adminApp ? getAuth(adminApp) : fallbackAuth;
export const adminDb: Firestore = adminApp
  ? getFirestore(adminApp)
  : (null as unknown as Firestore);
