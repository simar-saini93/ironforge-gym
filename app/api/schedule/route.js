import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  try {
    const db    = getAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const in30  = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 864e5).toISOString().split('T')[0];

    const { data: branch } = await db.from('branches').select('id, name').limit(1).single();
    if (!branch) return NextResponse.json({ error: 'Gym not configured' }, { status: 500 });

    const [
      { data: settings     },
      { data: holidays     },
      { data: dayOverrides },
      { data: duty         },
    ] = await Promise.all([
      db.from('gym_schedule_settings').select('*').eq('branch_id', branch.id).maybeSingle(),

      db.from('gym_holidays')
        .select('id, date, title, reason, cancelled_at')
        .eq('branch_id', branch.id)
        .gte('date', today)
        .lte('date', in30)
        .order('date', { ascending: true }),

      db.from('gym_day_overrides')
        .select('date, open_time, close_time, is_closed, notes')
        .eq('branch_id', branch.id)
        .gte('date', today)
        .lte('date', in30),

      db.from('trainer_duty')
        .select(`
          date, is_full_day, shift_start, shift_end,
          trainer:trainers(
            id,
            specialization,
            profile:profiles(first_name, last_name)
          )
        `)
        .eq('branch_id', branch.id)
        .gte('date', today)
        .lte('date', in30)
        .order('date', { ascending: true }),
    ]);

    // Active holidays only
    const activeHolidays = (holidays || []).filter((h) => !h.cancelled_at);

    // Check if tomorrow is a holiday or weekly off
    const weeklyOffs     = settings?.weekly_off_days || [];
    const tomorrowDay    = new Date(tomorrow + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const tomorrowIsOff  = weeklyOffs.includes(tomorrowDay);
    const tomorrowHol    = activeHolidays.find((h) => h.date === tomorrow);
    const tomorrowOver   = (dayOverrides || []).find((o) => o.date === tomorrow);
    const gymClosedTomorrow = tomorrowIsOff || !!tomorrowHol || tomorrowOver?.is_closed;

    // Check today
    const todayDay       = new Date(today + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayIsOff     = weeklyOffs.includes(todayDay);
    const todayHol       = activeHolidays.find((h) => h.date === today);
    const todayOver      = (dayOverrides || []).find((o) => o.date === today);
    const gymClosedToday = todayIsOff || !!todayHol || todayOver?.is_closed;

    // Today's timings
    const todayTimings = todayOver?.open_time ? {
      open:  todayOver.open_time,
      close: todayOver.close_time,
    } : {
      open:  settings?.default_open  || '06:00',
      close: settings?.default_close || '22:00',
    };

    // Group duty by date
    const dutyByDate = {};
    (duty || []).forEach((d) => {
      if (!dutyByDate[d.date]) dutyByDate[d.date] = [];
      dutyByDate[d.date].push({
        trainer_id:    d.trainer?.id,
        name:          `${d.trainer?.profile?.first_name || ''} ${d.trainer?.profile?.last_name || ''}`.trim(),
        specialization: d.trainer?.specialization,
        is_full_day:   d.is_full_day,
        shift_start:   d.shift_start,
        shift_end:     d.shift_end,
      });
    });

    return NextResponse.json({
      gym: {
        name:             branch.name,
        default_open:     settings?.default_open  || '06:00',
        default_close:    settings?.default_close || '22:00',
        weekly_off_days:  weeklyOffs,
      },
      today: {
        date:      today,
        is_closed: gymClosedToday,
        holiday:   todayHol || null,
        timings:   gymClosedToday ? null : todayTimings,
        trainers:  dutyByDate[today] || [],
      },
      tomorrow: {
        date:      tomorrow,
        is_closed: gymClosedTomorrow,
        holiday:   tomorrowHol || null,
        reason:    tomorrowHol?.title || (tomorrowIsOff ? 'Weekly off' : tomorrowOver?.notes || null),
      },
      holidays:     activeHolidays,
      day_overrides: dayOverrides || [],
      duty_by_date:  dutyByDate,
    }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });

  } catch (err) {
    console.error('[schedule/public]', err?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
