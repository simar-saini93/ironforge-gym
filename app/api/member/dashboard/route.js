import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import {
  profiles, members, memberSubscriptions, membershipPlans,
  memberTrainerAssignments, trainers, accessLogs, payments,
} from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { memberLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try { await memberLimiter.check(45, userId); }
    catch { return rateLimitResponse(45); }

    const profileRows = await drizzleDb
      .select({ first_name: profiles.first_name, last_name: profiles.last_name, email: profiles.email })
      .from(profiles).where(eq(profiles.id, userId)).limit(1);
    const profile = profileRows[0] || null;

    const memberRows = await drizzleDb
      .select({ id: members.id, member_number: members.member_number, profile_pic_url: members.profile_pic_url, created_at: members.created_at })
      .from(members).where(eq(members.profile_id, userId)).limit(1);
    const member = memberRows[0] || null;

    if (!member) return NextResponse.json({ profile, member: null, activeSub: null, trainer: null, attendanceCount: 0, recentPayments: [] }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });

    const subRows = await drizzleDb
      .select({ id: memberSubscriptions.id, status: memberSubscriptions.status, start_date: memberSubscriptions.start_date, end_date: memberSubscriptions.end_date, billing_cycle: membershipPlans.billing_cycle, price: membershipPlans.price })
      .from(memberSubscriptions)
      .leftJoin(membershipPlans, eq(memberSubscriptions.plan_id, membershipPlans.id))
      .where(eq(memberSubscriptions.member_id, member.id))
      .orderBy(desc(memberSubscriptions.end_date)).limit(1);

    const activeSub = subRows[0] ? { id: subRows[0].id, status: subRows[0].status, start_date: subRows[0].start_date, end_date: subRows[0].end_date, plan: { billing_cycle: subRows[0].billing_cycle, price: subRows[0].price } } : null;

    const trainerRows = await drizzleDb
      .select({ is_active: memberTrainerAssignments.is_active, specialization: trainers.specialization, first_name: profiles.first_name, last_name: profiles.last_name })
      .from(memberTrainerAssignments)
      .leftJoin(trainers, eq(memberTrainerAssignments.trainer_id, trainers.id))
      .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
      .where(and(eq(memberTrainerAssignments.member_id, member.id), eq(memberTrainerAssignments.is_active, true)))
      .limit(1);

    const trainer = trainerRows[0] ? { is_active: trainerRows[0].is_active, trainer: { specialization: trainerRows[0].specialization, profile: { first_name: trainerRows[0].first_name, last_name: trainerRows[0].last_name } } } : null;

    const attRows = await drizzleDb.select({ count: count() }).from(accessLogs).where(and(eq(accessLogs.member_id, member.id), eq(accessLogs.status, 'granted')));
    const attendanceCount = attRows[0]?.count ?? 0;

    const paymentRows = await drizzleDb
      .select({ id: payments.id, amount: payments.amount, payment_date: payments.payment_date, payment_method: payments.payment_method })
      .from(payments).where(eq(payments.member_id, member.id)).orderBy(desc(payments.payment_date)).limit(3);

    return NextResponse.json({ profile, member, activeSub, trainer, attendanceCount, recentPayments: paymentRows }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('[api/member/dashboard]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
