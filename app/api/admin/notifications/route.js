import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import {
  profiles, memberSubscriptions, members,
  leads, gymHolidays, trainers, trainerAttendance,
} from '@/db/schema';
import { eq, and, gte, lte, lt, desc, not, inArray } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    const profileRows = await drizzleDb
      .select({ branch_id: profiles.branch_id })
      .from(profiles).where(eq(profiles.id, userId)).limit(1);

    const branchId = profileRows[0]?.branch_id;
    if (!branchId) return NextResponse.json({ notifications: [] });

    const today = new Date().toISOString().split('T')[0];
    const in14  = new Date(Date.now() + 14 * 864e5).toISOString().split('T')[0];

    // ── Trainers who haven't marked attendance today ──────
    const allTrainers = await drizzleDb
      .select({ id: trainers.id, first_name: profiles.first_name, last_name: profiles.last_name })
      .from(trainers)
      .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
      .where(and(eq(trainers.branch_id, branchId), eq(trainers.is_active, true)));

    const markedToday = await drizzleDb
      .select({ trainer_id: trainerAttendance.trainer_id })
      .from(trainerAttendance)
      .where(and(eq(trainerAttendance.branch_id, branchId), eq(trainerAttendance.date, today)));

    const markedIds = new Set(markedToday.map((r) => r.trainer_id));
    const unmarkedTrainers = allTrainers.filter((t) => !markedIds.has(t.id));

    const [expiringRows, expiredRows, leadRows] = await Promise.all([
      drizzleDb
        .select({ id: memberSubscriptions.id, end_date: memberSubscriptions.end_date, first_name: profiles.first_name, last_name: profiles.last_name, member_id: members.id })
        .from(memberSubscriptions)
        .leftJoin(members, eq(memberSubscriptions.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .where(and(eq(memberSubscriptions.branch_id, branchId), eq(memberSubscriptions.status, 'active'), gte(memberSubscriptions.end_date, today), lte(memberSubscriptions.end_date, in14))),

      drizzleDb
        .select({ id: memberSubscriptions.id, end_date: memberSubscriptions.end_date, first_name: profiles.first_name, last_name: profiles.last_name, member_id: members.id })
        .from(memberSubscriptions)
        .leftJoin(members, eq(memberSubscriptions.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .where(and(eq(memberSubscriptions.branch_id, branchId), eq(memberSubscriptions.status, 'active'), lt(memberSubscriptions.end_date, today))),

      drizzleDb
        .select({ id: leads.id, first_name: leads.first_name, last_name: leads.last_name, created_at: leads.created_at })
        .from(leads)
        .where(and(eq(leads.branch_id, branchId), eq(leads.status, 'new')))
        .orderBy(desc(leads.created_at))
        .limit(5),
    ]);

    // ── Build notifications in component format ────────────
    const daysLeft = (dateStr) => {
      const diff = new Date(dateStr).getTime() - new Date(today).getTime();
      return Math.ceil(diff / 864e5);
    };

    const notifications = [
      ...expiringRows.map((s) => ({
        id:       `expiring-${s.id}`,
        type:     'expiring_soon',
        priority: daysLeft(s.end_date) <= 3 ? 'urgent' : 'warning',
        title:    `${s.first_name} ${s.last_name || ''} expiring soon`.trim(),
        body:     `Membership expires ${s.end_date} (${daysLeft(s.end_date)} days left)`,
        time:     new Date(s.end_date).toISOString(),
        link:     `/admin/members/${s.member_id}`,
      })),

      ...expiredRows.map((s) => ({
        id:       `expired-${s.id}`,
        type:     'expired',
        priority: 'urgent',
        title:    `${s.first_name} ${s.last_name || ''} membership expired`.trim(),
        body:     `Expired on ${s.end_date} — renew now`,
        time:     new Date(s.end_date).toISOString(),
        link:     `/admin/members/${s.member_id}`,
      })),

      ...leadRows.map((l) => ({
        id:       `lead-${l.id}`,
        type:     'new_lead',
        priority: 'high',
        title:    `New lead: ${l.first_name} ${l.last_name || ''}`.trim(),
        body:     'Follow up to convert to member',
        time:     l.created_at,
        link:     '/admin/crm',
      })),

      ...unmarkedTrainers.map((t) => ({
        id:       `trainer-${t.id}`,
        type:     'trainer_unmarked',
        priority: 'info',
        title:    `${t.first_name} ${t.last_name || ''} — attendance not marked`.trim(),
        body:     'No attendance recorded for today',
        time:     new Date().toISOString(),
        link:     `/admin/trainers/${t.id}`,
      })),
    ];

    return NextResponse.json({ notifications }, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
    });
  } catch (err) {
    console.error('[api/admin/notifications]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
