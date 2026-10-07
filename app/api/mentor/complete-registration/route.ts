import { NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { withServerDb } from '@/lib/firebase/serverDb';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyId,
      authorizedMentorDocId,
      mentorUserId,
      phone,
      designation,
      experience,
      expertise,
    } = body;

    if (!companyId || !authorizedMentorDocId || !mentorUserId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters.' },
        { status: 400 }
      );
    }

    await withServerDb(async (db) => {
      const updatePayload: Record<string, any> = {
        registered: true,
        mentorUserId,
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (phone) updatePayload.phone = phone;
      if (designation) updatePayload.designation = designation;
      if (experience !== undefined && experience !== null) updatePayload.experience = experience;
      if (expertise) updatePayload.expertise = expertise;

      await updateDoc(
        doc(db, 'companies', companyId, 'authorizedMentors', authorizedMentorDocId),
        updatePayload
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
