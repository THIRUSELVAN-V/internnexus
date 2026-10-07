import { NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { withServerDb } from '@/lib/firebase/serverDb';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, authorizedMentorDocId, mentorUserId } = body;

    if (!companyId || !authorizedMentorDocId || !mentorUserId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters.' },
        { status: 400 }
      );
    }

    await withServerDb(async (db) => {
      await updateDoc(
        doc(db, 'companies', companyId, 'authorizedMentors', authorizedMentorDocId),
        {
          registered: true,
          mentorUserId,
          registeredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[/api/mentor/complete-registration] Error:', err?.message ?? err);
    return NextResponse.json(
      { success: false, error: 'Failed to update mentor authorization status.' },
      { status: 500 }
    );
  }
}
