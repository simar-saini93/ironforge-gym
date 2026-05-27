import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import { profiles }     from '@/db/schema';
import { eq }           from 'drizzle-orm';
import { trainerLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try { await trainerLimiter.check(45, userId); }
    catch { return rateLimitResponse(45); }

    const rows = await drizzleDb
      .select({ first_name: profiles.first_name, last_name: profiles.last_name, email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    return NextResponse.json({ profile: rows[0] || null }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
    });
  } catch (err) {
    console.error('[api/trainer/profile]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
