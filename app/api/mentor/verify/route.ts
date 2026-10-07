import { NextResponse } from 'next/server';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { withServerDb } from '@/lib/firebase/serverDb';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, name, email } = body;

    if (!companyId || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing company, name, or email.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim().toLowerCase();

    const verificationResult = await withServerDb(async (db) => {
      // 1. Check whether user already has an account with this email
      const existingUserSnap = await getDocs(
        query(collection(db, 'users'), where('email', '==', normalizedEmail))
      );
      if (!existingUserSnap.empty) {
        return {
          success: false,
          error: 'An account with this email address already exists. Please sign in to your account.',
        };
      }

      // 2. Verification 1 - Company exists and is approved
      const compSnap = await getDoc(doc(db, 'companies', companyId));
      if (!compSnap.exists() || compSnap.data()?.status !== 'approved') {
        return {
          success: false,
          error: 'Selected company is not an approved organization on InternNexus.',
        };
      }

      const compData = compSnap.data();
      const companyName = compData.name || 'the selected company';

      // 3. Verification 2 & 3 - Check HR-authorized mentors
      const authMentorsRef = collection(db, 'companies', companyId, 'authorizedMentors');
      const authMentorsSnap = await getDocs(authMentorsRef);

      const matchingEmailDocs = authMentorsSnap.docs.filter((d) => {
        const dData = d.data();
        return (dData.email || '').trim().toLowerCase() === normalizedEmail;
      });

      if (matchingEmailDocs.length === 0) {
        return {
          success: false,
          error: `Mentor authorization failed. Your name and email are not registered as an authorized mentor for ${companyName}. Please contact your company's HR.`,
        };
      }

      const matchingNameDoc = matchingEmailDocs.find((d) => {
        const dData = d.data();
        return (dData.name || '').trim().toLowerCase() === normalizedName;
      });

      if (!matchingNameDoc) {
        return {
          success: false,
          error: `Mentor authorization failed. The mentor name "${name.trim()}" does not match the authorized mentor record on file for this email at ${companyName}. Please contact your company's HR.`,
        };
      }

      const mentorDocData = matchingNameDoc.data();
      if (mentorDocData.registered) {
        return {
          success: false,
          error: 'This authorized mentor account has already been registered. Please sign in to access your portal.',
        };
      }

      return {
        success: true,
        authorizedMentorDocId: matchingNameDoc.id,
        addedByHR: mentorDocData.addedByHR || null,
        companyName,
      };
    });

    if (!verificationResult.success) {
      return NextResponse.json(verificationResult, { status: 400 });
    }

    return NextResponse.json(verificationResult);
  } catch (err: any) {
    console.error('[/api/mentor/verify] Error:', err?.message ?? err);
    return NextResponse.json(
      { success: false, error: 'Failed to verify mentor authorization. Please try again.' },
      { status: 500 }
    );
  }
}
