import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import type { UserRole, Notification } from '@/lib/types';

export interface CreateNotificationParams {
  recipientUserId: string;
  recipientRole?: UserRole;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | string;
  category?: 'application' | 'task' | 'feedback' | 'assignment' | 'certificate' | 'system' | string;
  link?: string;
  relatedId?: string;
  relatedType?: 'internship' | 'application' | 'company' | 'task' | 'submission' | string;
}

/**
 * Creates a single targeted notification document in Firestore.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<string | null> {
  try {
    if (!params.recipientUserId) return null;
    const db = getFirebaseDb();
    const ref = await addDoc(collection(db, 'notifications'), {
      userId: params.recipientUserId,
      recipientUserId: params.recipientUserId,
      recipientRole: params.recipientRole || 'student',
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      category: params.category || params.relatedType || 'system',
      read: false,
      link: params.link || '',
      relatedId: params.relatedId || null,
      relatedType: params.relatedType || null,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

/**
 * Sends a notification to all registered student accounts.
 * Used for public events such as new internship postings.
 */
export async function notifyAllStudents(
  params: Omit<CreateNotificationParams, 'recipientUserId' | 'recipientRole'>
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const studentsSnap = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'student'))
    );
    if (studentsSnap.empty) return;

    const batch = writeBatch(db);
    let count = 0;
    const now = new Date().toISOString();

    for (const studentDoc of studentsSnap.docs) {
      const studentId = studentDoc.id;
      const ref = doc(collection(db, 'notifications'));
      batch.set(ref, {
        userId: studentId,
        recipientUserId: studentId,
        recipientRole: 'student',
        title: params.title,
        message: params.message,
        type: params.type || 'info',
        category: params.category || params.relatedType || 'system',
        read: false,
        link: params.link || '',
        relatedId: params.relatedId || null,
        relatedType: params.relatedType || null,
        createdAt: now,
      });
      count++;
      if (count >= 400) break; // Spark plan safe batch boundary
    }
    await batch.commit();
  } catch (err) {
    console.error('Failed to notify students:', err);
  }
}

/**
 * Sends a notification to all platform administrators.
 * Used for administrative events such as new company registrations requiring approval.
 */
export async function notifyAllAdmins(
  params: Omit<CreateNotificationParams, 'recipientUserId' | 'recipientRole'>
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const adminsSnap = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'admin'))
    );
    if (adminsSnap.empty) return;

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const adminDoc of adminsSnap.docs) {
      const adminId = adminDoc.id;
      const ref = doc(collection(db, 'notifications'));
      batch.set(ref, {
        userId: adminId,
        recipientUserId: adminId,
        recipientRole: 'admin',
        title: params.title,
        message: params.message,
        type: params.type || 'info',
        category: params.category || params.relatedType || 'system',
        read: false,
        link: params.link || '',
        relatedId: params.relatedId || null,
        relatedType: params.relatedType || null,
        createdAt: now,
      });
    }
    await batch.commit();
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }
}

/**
 * Sends a notification to all students who have applied for a specific internship.
 * Used when an internship's details, schedule, or conditions are updated.
 */
export async function notifyStudentsForInternship(
  internshipId: string,
  params: Omit<CreateNotificationParams, 'recipientUserId' | 'recipientRole'>
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const appsSnap = await getDocs(
      query(collection(db, 'applications'), where('internshipId', '==', internshipId))
    );
    if (appsSnap.empty) return;

    const studentIds = Array.from(
      new Set(
        appsSnap.docs
          .map((d) => d.data().studentId)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (studentIds.length === 0) return;

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const studentId of studentIds) {
      const ref = doc(collection(db, 'notifications'));
      batch.set(ref, {
        userId: studentId,
        recipientUserId: studentId,
        recipientRole: 'student',
        title: params.title,
        message: params.message,
        type: params.type || 'info',
        category: params.category || params.relatedType || 'system',
        read: false,
        link: params.link || '',
        relatedId: params.relatedId || internshipId,
        relatedType: params.relatedType || 'internship',
        createdAt: now,
      });
    }
    await batch.commit();
  } catch (err) {
    console.error('Failed to notify students for internship:', err);
  }
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
    });
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
  }
}

/**
 * Marks all unread notifications for a user as read.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    const unreadSnap = await getDocs(
      query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      )
    );
    if (unreadSnap.empty) return;

    const batch = writeBatch(db);
    for (const d of unreadSnap.docs) {
      batch.update(d.ref, { read: true });
    }
    await batch.commit();
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err);
  }
}

/**
 * Subscribes to real-time notifications for a specific user.
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        let createdAtStr = new Date().toISOString();
        if (data.createdAt) {
          if (typeof data.createdAt === 'string') {
            createdAtStr = data.createdAt;
          } else if (typeof data.createdAt.toDate === 'function') {
            createdAtStr = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt.seconds === 'number') {
            createdAtStr = new Date(data.createdAt.seconds * 1000).toISOString();
          }
        }

        return {
          id: d.id,
          userId: data.userId || userId,
          recipientUserId: data.recipientUserId || data.userId || userId,
          recipientRole: data.recipientRole,
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'info',
          category: data.category || 'system',
          read: Boolean(data.read),
          link: data.link || '',
          relatedId: data.relatedId,
          relatedType: data.relatedType,
          createdAt: createdAtStr,
        } as Notification;
      });

      // Sort newest first in-memory to avoid requiring composite Firestore indexes on Spark plan
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (err) => {
      console.error('Notifications subscription error:', err);
    }
  );
}
