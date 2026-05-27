import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import {
  payments, members, memberSubscriptions, membershipPlans,
  accessLogs, trainers, trainerAttendance, leads, profiles,
} from '@/db/schema';
import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const querySchema = z.object({
  tab:    z.enum(['revenue', 'members', 'expiring', 'attendance', 'trainer_att', 'leads']),
  filter: z.coerce.number().optional(),
});

function last12MonthsStart() {
  const d = new Date();
  d.setMonth(d.getMonth() - 11);
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getLast12Months() {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(30, userId); }
    catch { return rateLimitResponse(30); }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      tab:    searchParams.get('tab'),
      filter: searchParams.get('filter') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    const { tab, filter } = parsed.data;
    const months   = getLast12Months();
    const start    = `${months[0]}-01`;
    const today    = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];

    // ── Revenue ───────────────────────────────────────────────
    if (tab === 'revenue') {
      const rows = await drizzleDb
        .select({ amount: payments.amount, payment_date: payments.payment_date, payment_method: payments.payment_method })
        .from(payments)
        .where(gte(payments.payment_date, new Date(start)));

      const byMonth = {};
      months.forEach((m) => (byMonth[m] = 0));
      const methods = {};
      let total = 0;

      rows.forEach((p) => {
        const k = monthKey(p.payment_date?.toISOString() || '');
        if (byMonth[k] !== undefined) byMonth[k] += Number(p.amount);
        const m = p.payment_method || 'other';
        methods[m] = (methods[m] || 0) + Number(p.amount);
        total += Number(p.amount);
      });

      const thisMonthKey = monthKey(new Date().toISOString());
      return NextResponse.json({
        chartData:  months.map((m) => ({ label: m, value: Math.round(byMonth[m]) })),
        methods, total,
        thisMonth:  byMonth[thisMonthKey] || 0,
        count:      rows.length,
      });
    }

    // ── Members ───────────────────────────────────────────────
    if (tab === 'members') {
      const [memberRows, activeSubs, expiredSubs, totalCount] = await Promise.all([
        drizzleDb.select({ id: members.id, created_at: members.created_at }).from(members).where(gte(members.created_at, new Date(start))),
        drizzleDb.select({ count: count() }).from(memberSubscriptions).where(eq(memberSubscriptions.status, 'active')),
        drizzleDb.select({ count: count() }).from(memberSubscriptions).where(eq(memberSubscriptions.status, 'expired')),
        drizzleDb.select({ count: count() }).from(members),
      ]);

      const byMonth = {};
      months.forEach((m) => (byMonth[m] = 0));
      memberRows.forEach((m) => {
        const k = monthKey(m.created_at?.toISOString() || '');
        if (byMonth[k] !== undefined) byMonth[k]++;
      });

      return NextResponse.json({
        chartData:     months.map((m) => ({ label: m, value: byMonth[m] })),
        total:         totalCount[0]?.count ?? 0,
        active:        activeSubs[0]?.count ?? 0,
        expired:       expiredSubs[0]?.count ?? 0,
        newThisMonth:  byMonth[monthKey(new Date().toISOString())] || 0,
      });
    }

    // ── Expiring ──────────────────────────────────────────────
    if (tab === 'expiring') {
      const days = filter || 30;
      const end  = new Date();
      end.setDate(end.getDate() + days);
      const endDate = end.toISOString().split('T')[0];

      const rows = await drizzleDb
        .select({
          id:            memberSubscriptions.id,
          status:        memberSubscriptions.status,
          end_date:      memberSubscriptions.end_date,
          billing_cycle: membershipPlans.billing_cycle,
          price:         membershipPlans.price,
          member_number: members.member_number,
          first_name:    profiles.first_name,
          last_name:     profiles.last_name,
          email:         profiles.email,
          phone:         profiles.phone,
        })
        .from(memberSubscriptions)
        .leftJoin(membershipPlans, eq(memberSubscriptions.plan_id, membershipPlans.id))
        .leftJoin(members, eq(memberSubscriptions.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .where(and(
          eq(memberSubscriptions.status, 'active'),
          gte(memberSubscriptions.end_date, today),
          lte(memberSubscriptions.end_date, endDate),
        ))
        .orderBy(memberSubscriptions.end_date);

      return NextResponse.json({ subs: rows });
    }

    // ── Attendance ────────────────────────────────────────────
    if (tab === 'attendance') {
      const [logs, todayCount] = await Promise.all([
        drizzleDb.select({ accessed_at: accessLogs.accessed_at }).from(accessLogs)
          .where(and(eq(accessLogs.status, 'granted'), gte(accessLogs.accessed_at, new Date(start)))),
        drizzleDb.select({ count: count() }).from(accessLogs)
          .where(and(eq(accessLogs.status, 'granted'), gte(accessLogs.accessed_at, new Date(today)))),
      ]);

      const byMonth = {};
      months.forEach((m) => (byMonth[m] = 0));
      logs.forEach((l) => {
        const k = monthKey(l.accessed_at?.toISOString() || '');
        if (byMonth[k] !== undefined) byMonth[k]++;
      });

      const thisMonthKey = monthKey(new Date().toISOString());
      return NextResponse.json({
        chartData:  months.map((m) => ({ label: m, value: byMonth[m] })),
        total:      logs.length,
        thisMonth:  byMonth[thisMonthKey] || 0,
        today:      todayCount[0]?.count ?? 0,
      });
    }

    // ── Trainer Attendance ────────────────────────────────────
    if (tab === 'trainer_att') {
      const trainerRows = await drizzleDb
        .select({
          id:             trainers.id,
          specialization: trainers.specialization,
          first_name:     profiles.first_name,
          last_name:      profiles.last_name,
        })
        .from(trainers)
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .where(eq(trainers.is_active, true));

      const attRows = await drizzleDb
        .select({ trainer_id: trainerAttendance.trainer_id, status: trainerAttendance.status, date: trainerAttendance.date })
        .from(trainerAttendance)
        .where(gte(trainerAttendance.date, monthStart));

      const attByTrainer = {};
      attRows.forEach((a) => {
        if (!attByTrainer[a.trainer_id]) attByTrainer[a.trainer_id] = [];
        attByTrainer[a.trainer_id].push(a);
      });

      const result = trainerRows.map((t) => {
        const att     = attByTrainer[t.id] || [];
        const present = att.filter((a) => a.status === 'present').length;
        const absent  = att.filter((a) => a.status === 'absent').length;
        const leave   = att.filter((a) => a.status === 'leave').length;
        const total   = present + absent + leave;
        const rate    = total > 0 ? Math.round((present / total) * 100) : null;
        const todayAtt = att.find((a) => a.date === today);
        return { ...t, present, absent, leave, rate, todayStatus: todayAtt?.status || null };
      });

      return NextResponse.json({ trainers: result });
    }

    // ── Leads ─────────────────────────────────────────────────
    if (tab === 'leads') {
      const rows = await drizzleDb
        .select({ id: leads.id, status: leads.status, source: leads.source, created_at: leads.created_at })
        .from(leads)
        .where(gte(leads.created_at, new Date(start)));

      const byMonth = {};
      months.forEach((m) => (byMonth[m] = 0));
      const byStatus = {};
      const bySource = {};

      rows.forEach((l) => {
        const k = monthKey(l.created_at?.toISOString() || '');
        if (byMonth[k] !== undefined) byMonth[k]++;
        byStatus[l.status] = (byStatus[l.status] || 0) + 1;
        bySource[l.source] = (bySource[l.source] || 0) + 1;
      });

      const total     = rows.length;
      const converted = byStatus['converted'] || 0;
      const convRate  = total > 0 ? Math.round((converted / total) * 100) : 0;

      return NextResponse.json({
        chartData: months.map((m) => ({ label: m, value: byMonth[m] })),
        total, converted, convRate, byStatus, bySource,
      });
    }

  } catch (err) {
    console.error('[api/admin/reports] error:', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
