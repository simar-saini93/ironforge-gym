import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import { members, memberSubscriptions, membershipPlans } from '@/db/schema';
import { eq, desc }     from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const memberRows = await drizzleDb.select({ id: members.id }).from(members).where(eq(members.profile_id, userId)).limit(1);
    const member = memberRows[0];
    if (!member) return NextResponse.json({ subs: [] });

    const rows = await drizzleDb
      .select({
        id:            memberSubscriptions.id,
        status:        memberSubscriptions.status,
        start_date:    memberSubscriptions.start_date,
        end_date:      memberSubscriptions.end_date,
        billing_cycle: membershipPlans.billing_cycle,
        price:         membershipPlans.price,
      })
      .from(memberSubscriptions)
      .leftJoin(membershipPlans, eq(memberSubscriptions.plan_id, membershipPlans.id))
      .where(eq(memberSubscriptions.member_id, member.id))
      .orderBy(desc(memberSubscriptions.created_at));

    return NextResponse.json({
      subs: rows.map((s) => ({
        id: s.id, status: s.status, start_date: s.start_date, end_date: s.end_date,
        plan: { billing_cycle: s.billing_cycle, price: s.price },
      })),
    });
  } catch (err) {
    console.error('[api/member/subscription]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
