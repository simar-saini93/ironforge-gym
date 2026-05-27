import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import { payments, members, profiles, memberSubscriptions, membershipPlans } from '@/db/schema';
import { eq, and }      from 'drizzle-orm';
import { memberLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try { await memberLimiter.check(45, userId); }
    catch { return rateLimitResponse(45); }

    const { id } = await params;

    const rows = await drizzleDb
      .select({
        id:              payments.id,
        amount:          payments.amount,
        payment_method:  payments.payment_method,
        payment_date:    payments.payment_date,
        reference_no:    payments.reference_no,
        notes:           payments.notes,
        created_at:      payments.created_at,
        member_id:       members.id,
        member_number:   members.member_number,
        profile_id:      members.profile_id,
        first_name:      profiles.first_name,
        last_name:       profiles.last_name,
        start_date:      memberSubscriptions.start_date,
        end_date:        memberSubscriptions.end_date,
        billing_cycle:   membershipPlans.billing_cycle,
        plan_price:      membershipPlans.price,
      })
      .from(payments)
      .leftJoin(members,             eq(payments.member_id,          members.id))
      .leftJoin(profiles,            eq(members.profile_id,          profiles.id))
      .leftJoin(memberSubscriptions, eq(payments.subscription_id,    memberSubscriptions.id))
      .leftJoin(membershipPlans,     eq(memberSubscriptions.plan_id, membershipPlans.id))
      .where(eq(payments.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    // ── Member can only view own payments ─────────────────────
    if (row.profile_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      payment: {
        id:             row.id,
        amount:         row.amount,
        payment_method: row.payment_method,
        payment_date:   row.payment_date,
        reference_no:   row.reference_no,
        notes:          row.notes,
        created_at:     row.created_at,
        member: {
          member_number: row.member_number,
          profile: { first_name: row.first_name, last_name: row.last_name },
        },
        subscription: {
          start_date: row.start_date,
          end_date:   row.end_date,
          plan:       { billing_cycle: row.billing_cycle, price: row.plan_price },
        },
      },
    }, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (err) {
    console.error('[api/member/payments/[id]]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
