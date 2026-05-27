import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ role: null }, { status: 401 });

    const role     = sessionClaims?.metadata?.role || null;
    const branchId = sessionClaims?.metadata?.branchId || null;

    return NextResponse.json({ role, branchId }, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (err) {
    console.error('[api/auth/role]', err?.message);
    return NextResponse.json({ role: null }, { status: 500 });
  }
}
