import { NextResponse } from 'next/server';
import { drizzleDb }    from '@/db/index';
import { branches }     from '@/db/schema';
import { publicLimiter, getIP, rateLimitResponse } from '@/lib/utils/rate-limit';

// Cache branch data — changes rarely
// private: per-user, max-age: 5 min, stale-while-revalidate: 10 min
const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
};

export async function GET(request) {
  try {
    // ── Rate limit — 100 per minute per IP ───────────────────
    const ip = getIP(request);
    try { await publicLimiter.check(100, ip); }
    catch { return rateLimitResponse(100); }

    // ── Query ─────────────────────────────────────────────────
    const result = await drizzleDb
      .select({
        id:       branches.id,
        name:     branches.name,
        currency: branches.currency,
        phone:    branches.phone,
        email:    branches.email,
        address:  branches.address,
      })
      .from(branches)
      .limit(1);

    const branch = result[0] ?? null;

    if (!branch) {
      return NextResponse.json(
        { branch: null, error: 'No branch found' },
        { status: 404, headers: CACHE_HEADERS }
      );
    }

    return NextResponse.json({ branch }, { headers: CACHE_HEADERS });

  } catch (err) {
    console.error('[api/branch] FULL ERROR:', err);
    return NextResponse.json(
      { branch: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
