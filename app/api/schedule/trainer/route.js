import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import { trainers, trainerDuty } from '@/db/schema';
import { eq, gte, asc } from 'drizzle-orm';
import { trainerLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function GET() {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const { userId, sessionClaims } = await auth();
    const role = sessionClaims?.metadata?.role;
    if (!userId || role !== 'trainer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────
    try { await trainerLimiter.check(45, userId); }
    catch { return rateLimitResponse(45); }

    // ── Get trainer record ────────────────────────────────────
    const trainerRows = await drizzleDb
      .select({ id: trainers.id })
      .from(trainers)
      .where(eq(trainers.profile_id, userId))
      .limit(1);

    const trainer = trainerRows[0];
    if (!trainer) return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });

    // ── Get upcoming duty ─────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];

    const duty = await drizzleDb
      .select({
        id:          trainerDuty.id,
        date:        trainerDuty.date,
        is_full_day: trainerDuty.is_full_day,
        shift_start: trainerDuty.shift_start,
        shift_end:   trainerDuty.shift_end,
      })
      .from(trainerDuty)
      .where(eq(trainerDuty.trainer_id, trainer.id))
      // Note: gte on date column — Drizzle handles date string comparison correctly
      .orderBy(asc(trainerDuty.date));

    // Filter for today onwards (date is stored as string 'YYYY-MM-DD')
    const upcoming    = duty.filter((d) => d.date >= today);
    const today_duty  = upcoming.find((d) => d.date === today) || null;

    return NextResponse.json({
      today_duty,
      upcoming,
    }, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });

  } catch (err) {
    console.error('[api/schedule/trainer]', err?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
