import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { withServerDb } from "./serverDb";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  type WhereFilterOp,
} from "firebase/firestore";

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


function createFallbackDb(): Firestore {
  function createCollectionRef(collectionPath: string, existingConstraints: any[] = []): any {
    return {
      doc: (docPath?: string) => {
        const id = docPath || "";
        return {
          id,
          get: async () => {
            return withServerDb(async (db) => {
              const docRef = doc(db, collectionPath, id);
              const snap = await getDoc(docRef);
              return {
                id: snap.id,
                exists: snap.exists(),
                data: () => snap.data(),
              };
            });
          },
          set: async (data: any, options?: any) => {
            return withServerDb(async (db) => {
              const docRef = doc(db, collectionPath, id);
              return setDoc(docRef, data, options);
            });
          },
          update: async (data: any) => {
            return withServerDb(async (db) => {
              const docRef = doc(db, collectionPath, id);
              return updateDoc(docRef, data);
            });
          },
          delete: async () => {
            return withServerDb(async (db) => {
              const docRef = doc(db, collectionPath, id);
              return deleteDoc(docRef);
            });
          },
        };
      },
      where: (fieldPath: string, opStr: string, value: any) => {
        return createCollectionRef(collectionPath, [
          ...existingConstraints,
          where(fieldPath, opStr as WhereFilterOp, value),
        ]);
      },
      get: async () => {
        return withServerDb(async (db) => {
          const colRef = collection(db, collectionPath);
          const q =
            existingConstraints.length > 0
              ? query(colRef, ...existingConstraints)
              : colRef;
          const snap = await getDocs(q);
          return {
            empty: snap.empty,
            size: snap.size,
            docs: snap.docs.map((d) => ({
              id: d.id,
              exists: true,
              data: () => d.data(),
            })),
          };
        });
      },
    };
  }

  return {
    collection: (collectionPath: string) => createCollectionRef(collectionPath),
    doc: (docPath: string) => {
      const parts = docPath.split("/");
      const collectionPath = parts.slice(0, -1).join("/");
      const docId = parts[parts.length - 1];
      return createCollectionRef(collectionPath).doc(docId);
    },
  } as unknown as Firestore;
}

export const adminAuth: Auth = adminApp ? getAuth(adminApp) : fallbackAuth;
export const adminDb: Firestore = adminApp
  ? getFirestore(adminApp)
  : createFallbackDb();
