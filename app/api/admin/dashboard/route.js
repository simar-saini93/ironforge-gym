import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import {
  members, memberSubscriptions, membershipPlans,
  leads, accessLogs, trainers, trainerAttendance,
  payments, profiles, branches,
} from '@/db/schema';
import { eq, and, gte, lte, lt, desc, count, sum, sql } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function GET(request) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit ────────────────────────────────────────────
    try { await adminLimiter.check(30, userId); }
    catch { return rateLimitResponse(30); }

    const today = new Date().toISOString().split('T')[0];
    const in30  = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // ── Run all queries in parallel ───────────────────────────
    const [
      activeMembersResult,
      expiringResult,
      newLeadsResult,
      recentAccessResult,
      trainersResult,
      paymentsResult,
    ] = await Promise.all([

      // 1. Active members count
      drizzleDb
        .select({ count: count() })
        .from(members)
        .where(eq(members.is_active, true)),

      // 2. Expiring subscriptions in 30 days
      drizzleDb
        .select({
          id:            memberSubscriptions.id,
          end_date:      memberSubscriptions.end_date,
          billing_cycle: membershipPlans.billing_cycle,
          first_name:    profiles.first_name,
          last_name:     profiles.last_name,
        })
        .from(memberSubscriptions)
        .leftJoin(membershipPlans, eq(memberSubscriptions.plan_id, membershipPlans.id))
        .leftJoin(members, eq(memberSubscriptions.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .where(
          and(
            eq(memberSubscriptions.status, 'active'),
            gte(memberSubscriptions.end_date, today),
            lte(memberSubscriptions.end_date, in30)
          )
        )
        .orderBy(memberSubscriptions.end_date)
        .limit(8),

      // 3. New leads count
      drizzleDb
        .select({ count: count() })
        .from(leads)
        .where(eq(leads.status, 'new')),

      // 4. Recent access logs
      drizzleDb
        .select({
          id:          accessLogs.id,
          method:      accessLogs.method,
          status:      accessLogs.status,
          accessed_at: accessLogs.accessed_at,
          first_name:  profiles.first_name,
          last_name:   profiles.last_name,
        })
        .from(accessLogs)
        .leftJoin(members, eq(accessLogs.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .orderBy(desc(accessLogs.accessed_at))
        .limit(8),

      // 5. Trainers with attendance
      drizzleDb
        .select({
          id:         trainers.id,
          first_name: profiles.first_name,
          last_name:  profiles.last_name,
          att_date:   trainerAttendance.date,
          att_status: trainerAttendance.status,
        })
        .from(trainers)
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .leftJoin(trainerAttendance, eq(trainers.id, trainerAttendance.trainer_id))
        .where(eq(trainers.is_active, true))
        .limit(50),

      // 6. Payments this month
      drizzleDb
        .select({ amount: payments.amount })
        .from(payments)
        .where(gte(payments.payment_date, new Date(monthStart))),
    ]);

    // ── Format expiring ───────────────────────────────────────
    const expiring = expiringResult.map((s) => {
      const daysLeft = Math.ceil((new Date(s.end_date) - new Date()) / 864e5);
      return {
        id:       s.id,
        name:     `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown',
        plan:     s.billing_cycle?.replace('_', ' ') || 'Plan',
        date:     new Date(s.end_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        daysLeft,
      };
    });

    // ── Format activity ───────────────────────────────────────
    const activity = recentAccessResult.map((a) => {
      const name      = `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Unknown';
      const time      = new Date(a.accessed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const isGranted = a.status === 'granted';
      return {
        id:      a.id,
        type:    isGranted ? 'access_granted' : 'access_denied',
        message: isGranted
          ? `<strong style="color:var(--if-text)">${name}</strong> entered via ${a.method === 'qr' ? 'QR scan' : '4-digit code'}`
          : `<strong style="color:var(--if-text)">${name}</strong> access denied — ${a.method}`,
        time,
      };
    });

    // ── Format trainers ───────────────────────────────────────
    const trainerMap = {};
    for (const row of trainersResult) {
      if (!trainerMap[row.id]) {
        trainerMap[row.id] = {
          id:         row.id,
          name:       `${row.first_name || ''} ${row.last_name || ''}`.trim(),
          attendance: [],
        };
      }
      if (row.att_date) {
        trainerMap[row.id].attendance.push({ date: row.att_date, status: row.att_status });
      }
    }

    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];
    const formattedTrainers = Object.values(trainerMap || {}).map((t) => {
      const thisWeek  = t.attendance.filter((a) => a.date >= weekAgo && a.date <= today);
      const present   = thisWeek.filter((a) => a.status === 'present').length;
      const todayAtt  = t.attendance.find((a) => a.date === today);
      return {
        id:          t.id,
        name:        t.name,
        todayStatus: todayAtt?.status || 'absent',
        present,
        total:       5,
      };
    }).slice(0, 5);

    // ── Revenue ───────────────────────────────────────────────
    const revenue = paymentsResult.reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      activeMembers: activeMembersResult[0]?.count ?? 0,
      expiring,
      newLeads:      newLeadsResult[0]?.count ?? 0,
      activity,
      trainers:      formattedTrainers,
      revenue,
    }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
    });

  } catch (err) {
    console.error('[api/admin/dashboard] error:', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
