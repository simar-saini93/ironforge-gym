import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import { profiles }      from '@/db/schema';
import { eq }            from 'drizzle-orm';
import { adminLimiter, getIP, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function GET(request) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────
    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    // ── Query ─────────────────────────────────────────────────
    const result = await drizzleDb
      .select({
        first_name: profiles.first_name,
        last_name:  profiles.last_name,
        email:      profiles.email,
        role:       profiles.role,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const profile = result[0] ?? null;

    return NextResponse.json({ profile }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
    });

  } catch (err) {
    console.error('[api/admin/profile] error:', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
