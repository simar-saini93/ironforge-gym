import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import {
  branches, trainerDuty, trainerDutyPatterns,
  gymScheduleSettings, gymHolidays, trainers, profiles,
} from '@/db/schema';
import { eq, and, gte, asc, desc, isNull } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const today = () => new Date().toISOString().split('T')[0];

async function getBranchId() {
  const result = await drizzleDb.select({ id: branches.id }).from(branches).limit(1);
  return result[0]?.id ?? null;
}

// ── GET — duty, patterns, settings, holidays ──────────────────
export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    const branchId = await getBranchId();
    if (!branchId) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    const [dutyRows, patternRows, settingsRow, holidayRows] = await Promise.all([
      drizzleDb
        .select({
          id: trainerDuty.id, date: trainerDuty.date,
          trainer_id: trainerDuty.trainer_id,
          is_full_day: trainerDuty.is_full_day,
          shift_start: trainerDuty.shift_start,
          shift_end:   trainerDuty.shift_end,
          first_name:  profiles.first_name,
          last_name:   profiles.last_name,
        })
        .from(trainerDuty)
        .leftJoin(trainers, eq(trainerDuty.trainer_id, trainers.id))
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .where(and(eq(trainerDuty.branch_id, branchId), gte(trainerDuty.date, today())))
        .orderBy(asc(trainerDuty.date)),

      drizzleDb
        .select({
          id: trainerDutyPatterns.id,
          trainer_id:   trainerDutyPatterns.trainer_id,
          days_of_week: trainerDutyPatterns.days_of_week,
          start_date:   trainerDutyPatterns.start_date,
          end_date:     trainerDutyPatterns.end_date,
          is_full_day:  trainerDutyPatterns.is_full_day,
          shift_start:  trainerDutyPatterns.shift_start,
          shift_end:    trainerDutyPatterns.shift_end,
          first_name:   profiles.first_name,
          last_name:    profiles.last_name,
        })
        .from(trainerDutyPatterns)
        .leftJoin(trainers, eq(trainerDutyPatterns.trainer_id, trainers.id))
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .where(and(eq(trainerDutyPatterns.branch_id, branchId), gte(trainerDutyPatterns.end_date, today())))
        .orderBy(desc(trainerDutyPatterns.created_at)),

      drizzleDb.select({ weekly_off_days: gymScheduleSettings.weekly_off_days })
        .from(gymScheduleSettings).where(eq(gymScheduleSettings.branch_id, branchId)).limit(1),

      drizzleDb.select({ date: gymHolidays.date })
        .from(gymHolidays)
        .where(and(eq(gymHolidays.branch_id, branchId), gte(gymHolidays.date, today()), isNull(gymHolidays.cancelled_at))),
    ]);

    return NextResponse.json({
      branchId,
      duty:     dutyRows.map((d) => ({ ...d, trainer: { profile: { first_name: d.first_name, last_name: d.last_name } } })),
      patterns: patternRows.map((p) => ({ ...p, trainer: { profile: { first_name: p.first_name, last_name: p.last_name } } })),
      settings: settingsRow[0] ?? null,
      holidays: holidayRows.map((h) => h.date),
    });
  } catch (err) {
    console.error('[api/admin/duty GET]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — save/delete duty and patterns ──────────────────────
const actionSchema = z.object({
  action:   z.enum(['add_duty', 'remove_duty', 'add_pattern', 'delete_pattern', 'delete_pattern_dates']),
  branchId: z.string().uuid(),
  data:     z.any(),
});

export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(30, userId); }
    catch { return rateLimitResponse(30); }

    const body   = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { action, branchId, data } = parsed.data;

    if (action === 'add_duty') {
      await drizzleDb.insert(trainerDuty).values({
        branch_id:   branchId,
        trainer_id:  data.trainer_id,
        date:        data.date,
        is_full_day: data.is_full_day,
        shift_start: data.shift_start,
        shift_end:   data.shift_end,
      }).onConflictDoUpdate({
        target: [trainerDuty.branch_id, trainerDuty.trainer_id, trainerDuty.date],
        set: { is_full_day: data.is_full_day, shift_start: data.shift_start, shift_end: data.shift_end },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'remove_duty') {
      await drizzleDb.delete(trainerDuty).where(eq(trainerDuty.id, data.id));
      return NextResponse.json({ success: true });
    }

    if (action === 'add_pattern') {
      await drizzleDb.insert(trainerDutyPatterns).values({
        branch_id:    branchId,
        trainer_id:   data.trainer_id,
        days_of_week: data.days_of_week,
        start_date:   data.start_date,
        end_date:     data.end_date,
        is_full_day:  data.is_full_day,
        shift_start:  data.shift_start,
        shift_end:    data.shift_end,
        created_by:   userId,
      });

      // Insert individual duty rows in batch
      if (data.dates?.length > 0) {
        const rows = data.dates.map((date) => ({
          branch_id:   branchId,
          trainer_id:  data.trainer_id,
          date,
          is_full_day: data.is_full_day,
          shift_start: data.shift_start,
          shift_end:   data.shift_end,
        }));

        for (let i = 0; i < rows.length; i += 50) {
          await drizzleDb.insert(trainerDuty).values(rows.slice(i, i + 50))
            .onConflictDoNothing();
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_pattern') {
      await drizzleDb.delete(trainerDutyPatterns).where(eq(trainerDutyPatterns.id, data.id));
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_pattern_dates') {
      for (const date of (data.dates || [])) {
        await drizzleDb.delete(trainerDuty)
          .where(and(eq(trainerDuty.trainer_id, data.trainer_id), eq(trainerDuty.date, date)));
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[api/admin/duty POST]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
