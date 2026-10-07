import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { withServerDb } from '@/lib/firebase/serverDb';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const companies = await withServerDb(async (db) => {
      const snap = await getDocs(
        query(collection(db, 'companies'), where('status', '==', 'approved'))
      );
      const comps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      comps.sort((a: any, b: any) =>
        (a.name || '').localeCompare(b.name || '')
      );
      return comps;
    });

    return NextResponse.json({ companies });
  } catch (err: any) {
    console.error('[/api/companies/approved] Error:', err?.message ?? err);
    return NextResponse.json(
      { error: 'Failed to fetch approved companies.' },
      { status: 500 }
    );
  }
}
