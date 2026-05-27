import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import { trainers, trainerAttendance } from '@/db/schema';
import { eq, desc }     from 'drizzle-orm';
import { trainerLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

const PAGE_SIZE = 60;

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try { await trainerLimiter.check(45, userId); }
    catch { return rateLimitResponse(45); }

    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, Number(searchParams.get('page') || 1));
    const offset = (page - 1) * PAGE_SIZE;

    const trainerRows = await drizzleDb
      .select({ id: trainers.id })
      .from(trainers).where(eq(trainers.profile_id, userId)).limit(1);
    const trainer = trainerRows[0];
    if (!trainer) return NextResponse.json({ records: [], thisMonth: { present: 0, absent: 0, leave: 0 }, allTime: { present: 0, absent: 0, leave: 0 }, page, pages: 0 });

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];

    // All records for stats (no pagination — needed for accurate counts)
    const allRows = await drizzleDb
      .select({ id: trainerAttendance.id, date: trainerAttendance.date, status: trainerAttendance.status, notes: trainerAttendance.notes })
      .from(trainerAttendance)
      .where(eq(trainerAttendance.trainer_id, trainer.id))
      .orderBy(desc(trainerAttendance.date));

    // Paginated records for display
    const records = allRows.slice(offset, offset + PAGE_SIZE);
    const pages   = Math.ceil(allRows.length / PAGE_SIZE);

    // Compute stats
    const allTime   = { present: 0, absent: 0, leave: 0 };
    const thisMonth = { present: 0, absent: 0, leave: 0 };

    allRows.forEach((r) => {
      if (allTime[r.status] !== undefined) allTime[r.status]++;
      if (r.date >= startOfMonth && thisMonth[r.status] !== undefined) thisMonth[r.status]++;
    });

    return NextResponse.json({ records, thisMonth, allTime, page, pages }, {
      headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=40' },
    });
  } catch (err) {
    console.error('[api/trainer/attendance]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
