import { NextResponse }  from 'next/server';
import { drizzleDb }     from '@/db/index';
import {
  branches, gymScheduleSettings, gymHolidays,
  gymDayOverrides, trainerDuty, trainers, profiles,
} from '@/db/schema';
import { eq, and, gte, lte, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const today    = new Date().toISOString().split('T')[0];
    const in30     = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 864e5).toISOString().split('T')[0];

    // ── Get branch ────────────────────────────────────────────
    const branchRows = await drizzleDb
      .select({ id: branches.id, name: branches.name })
      .from(branches).limit(1);
    const branch = branchRows[0];
    if (!branch) return NextResponse.json({ error: 'Gym not configured' }, { status: 500 });

    // ── Parallel queries ──────────────────────────────────────
    const [settingsRows, holidayRows, overrideRows, dutyRows] = await Promise.all([

      drizzleDb
        .select()
        .from(gymScheduleSettings)
        .where(eq(gymScheduleSettings.branch_id, branch.id))
        .limit(1),

      drizzleDb
        .select({ id: gymHolidays.id, date: gymHolidays.date, title: gymHolidays.title, reason: gymHolidays.reason, cancelled_at: gymHolidays.cancelled_at })
        .from(gymHolidays)
        .where(and(eq(gymHolidays.branch_id, branch.id), gte(gymHolidays.date, today), lte(gymHolidays.date, in30)))
        .orderBy(asc(gymHolidays.date)),

      drizzleDb
        .select({ date: gymDayOverrides.date, open_time: gymDayOverrides.open_time, close_time: gymDayOverrides.close_time, is_closed: gymDayOverrides.is_closed, notes: gymDayOverrides.notes })
        .from(gymDayOverrides)
        .where(and(eq(gymDayOverrides.branch_id, branch.id), gte(gymDayOverrides.date, today), lte(gymDayOverrides.date, in30))),

      drizzleDb
        .select({
          date:           trainerDuty.date,
          is_full_day:    trainerDuty.is_full_day,
          shift_start:    trainerDuty.shift_start,
          shift_end:      trainerDuty.shift_end,
          trainer_id:     trainers.id,
          specialization: trainers.specialization,
          first_name:     profiles.first_name,
          last_name:      profiles.last_name,
        })
        .from(trainerDuty)
        .leftJoin(trainers, eq(trainerDuty.trainer_id, trainers.id))
        .leftJoin(profiles, eq(trainers.profile_id,    profiles.id))
        .where(and(eq(trainerDuty.branch_id, branch.id), gte(trainerDuty.date, today), lte(trainerDuty.date, in30)))
        .orderBy(asc(trainerDuty.date)),
    ]);

    const settings     = settingsRows[0] || null;
    const weeklyOffs   = settings?.weekly_off_days || [];
    const activeHolidays = holidayRows.filter((h) => !h.cancelled_at);

    // ── Helper — day name from date string ────────────────────
    function dayName(dateStr) {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    }

    // ── Today status ──────────────────────────────────────────
    const todayIsOff     = weeklyOffs.includes(dayName(today));
    const todayHol       = activeHolidays.find((h) => h.date === today) || null;
    const todayOver      = overrideRows.find((o) => o.date === today) || null;
    const gymClosedToday = todayIsOff || !!todayHol || !!todayOver?.is_closed;
    const todayTimings   = todayOver?.open_time
      ? { open: todayOver.open_time, close: todayOver.close_time }
      : { open: settings?.default_open || '06:00', close: settings?.default_close || '22:00' };

    // ── Tomorrow status ───────────────────────────────────────
    const tomorrowIsOff     = weeklyOffs.includes(dayName(tomorrow));
    const tomorrowHol       = activeHolidays.find((h) => h.date === tomorrow) || null;
    const tomorrowOver      = overrideRows.find((o) => o.date === tomorrow) || null;
    const gymClosedTomorrow = tomorrowIsOff || !!tomorrowHol || !!tomorrowOver?.is_closed;

    // ── Group duty by date ────────────────────────────────────
    const dutyByDate = {};
    dutyRows.forEach((d) => {
      if (!dutyByDate[d.date]) dutyByDate[d.date] = [];
      dutyByDate[d.date].push({
        trainer_id:     d.trainer_id,
        name:           `${d.first_name || ''} ${d.last_name || ''}`.trim(),
        specialization: d.specialization,
        is_full_day:    d.is_full_day,
        shift_start:    d.shift_start,
        shift_end:      d.shift_end,
      });
    });

    return NextResponse.json({
      gym: {
        name:            branch.name,
        default_open:    settings?.default_open  || '06:00',
        default_close:   settings?.default_close || '22:00',
        weekly_off_days: weeklyOffs,
      },
      today: {
        date:      today,
        is_closed: gymClosedToday,
        holiday:   todayHol,
        timings:   gymClosedToday ? null : todayTimings,
        trainers:  dutyByDate[today] || [],
      },
      tomorrow: {
        date:      tomorrow,
        is_closed: gymClosedTomorrow,
        holiday:   tomorrowHol,
        reason:    tomorrowHol?.title || (tomorrowIsOff ? 'Weekly off' : tomorrowOver?.notes || null),
      },
      holidays:      activeHolidays,
      day_overrides: overrideRows,
      duty_by_date:  dutyByDate,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });

  } catch (err) {
    console.error('[api/schedule]', err?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
