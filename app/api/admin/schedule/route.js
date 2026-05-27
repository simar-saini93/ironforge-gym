import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import {
  branches, gymScheduleSettings, gymHolidays,
  trainerDuty, gymDayOverrides, trainers, profiles,
} from '@/db/schema';
import { eq, and, gte, asc } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const today = () => new Date().toISOString().split('T')[0];

// ── GET — fetch all schedule data ─────────────────────────────
export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    const branchResult = await drizzleDb.select({ id: branches.id }).from(branches).limit(1);
    const branchId = branchResult[0]?.id;
    if (!branchId) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    const [settings, holidays, duty, dayOverrides, trainerList] = await Promise.all([
      drizzleDb.select().from(gymScheduleSettings).where(eq(gymScheduleSettings.branch_id, branchId)).limit(1),
      drizzleDb.select().from(gymHolidays).where(eq(gymHolidays.branch_id, branchId)).orderBy(asc(gymHolidays.date)),
      drizzleDb.select({
        id: trainerDuty.id, date: trainerDuty.date,
        is_full_day: trainerDuty.is_full_day,
        shift_start: trainerDuty.shift_start,
        shift_end:   trainerDuty.shift_end,
        trainer_id:  trainerDuty.trainer_id,
        first_name:  profiles.first_name,
        last_name:   profiles.last_name,
      })
        .from(trainerDuty)
        .leftJoin(trainers, eq(trainerDuty.trainer_id, trainers.id))
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .where(and(eq(trainerDuty.branch_id, branchId), gte(trainerDuty.date, today()))),
      drizzleDb.select().from(gymDayOverrides).where(eq(gymDayOverrides.branch_id, branchId)).orderBy(asc(gymDayOverrides.date)),
      drizzleDb.select({
        id: trainers.id, specialization: trainers.specialization,
        first_name: profiles.first_name, last_name: profiles.last_name,
      })
        .from(trainers)
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .where(eq(trainers.is_active, true)),
    ]);

    const shapedDuty = duty.map((d) => ({
      ...d,
      trainer_name: `${d.first_name || ''} ${d.last_name || ''}`.trim(),
    }));

    const shapedTrainers = trainerList.map((t) => ({
      id: t.id, specialization: t.specialization,
      profile: { first_name: t.first_name, last_name: t.last_name },
    }));

    return NextResponse.json({
      branchId,
      settings:     settings[0] ?? null,
      holidays:     holidays    ?? [],
      duty:         shapedDuty  ?? [],
      dayOverrides: dayOverrides ?? [],
      trainers:     shapedTrainers ?? [],
    }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
    });
  } catch (err) {
    console.error('[api/admin/schedule GET]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — save settings, overrides, holidays ─────────────────
const scheduleSchema = z.object({
  action: z.enum(['save_settings', 'save_override', 'delete_override', 'add_holiday', 'cancel_holiday']),
  branchId: z.string().uuid(),
  data: z.any(),
});

export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(20, userId); }
    catch { return rateLimitResponse(20); }

    const body   = await request.json();
    const parsed = scheduleSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { action, branchId, data } = parsed.data;

    if (action === 'save_settings') {
      await drizzleDb
        .insert(gymScheduleSettings)
        .values({ branch_id: branchId, default_open: data.default_open, default_close: data.default_close, weekly_off_days: data.weekly_off_days })
        .onConflictDoUpdate({
          target: gymScheduleSettings.branch_id,
          set: { default_open: data.default_open, default_close: data.default_close, weekly_off_days: data.weekly_off_days, updated_at: new Date() },
        });
      return NextResponse.json({ success: true });
    }

    if (action === 'save_override') {
      await drizzleDb
        .insert(gymDayOverrides)
        .values({ branch_id: branchId, date: data.date, open_time: data.open_time, close_time: data.close_time, is_closed: data.is_closed, notes: data.notes })
        .onConflictDoUpdate({
          target: [gymDayOverrides.branch_id, gymDayOverrides.date],
          set: { open_time: data.open_time, close_time: data.close_time, is_closed: data.is_closed, notes: data.notes },
        });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_override') {
      await drizzleDb.delete(gymDayOverrides).where(eq(gymDayOverrides.id, data.id));
      return NextResponse.json({ success: true });
    }

    if (action === 'add_holiday') {
      await drizzleDb.insert(gymHolidays).values({ branch_id: branchId, date: data.date, title: data.title, reason: data.reason || null });
      return NextResponse.json({ success: true });
    }

    if (action === 'cancel_holiday') {
      await drizzleDb.update(gymHolidays).set({ cancelled_at: new Date() }).where(eq(gymHolidays.id, data.id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[api/admin/schedule POST]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
