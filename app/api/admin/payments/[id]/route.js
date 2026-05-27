import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import { payments, members, profiles, memberSubscriptions, membershipPlans } from '@/db/schema';
import { eq }            from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function GET(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    const { id } = await params;

    const rows = await drizzleDb
      .select({
        id:             payments.id,
        amount:         payments.amount,
        payment_method: payments.payment_method,
        payment_date:   payments.payment_date,
        reference_no:   payments.reference_no,
        notes:          payments.notes,
        created_at:     payments.created_at,
        member_id:      members.id,
        member_number:  members.member_number,
        first_name:     profiles.first_name,
        last_name:      profiles.last_name,
        email:          profiles.email,
        sub_id:         memberSubscriptions.id,
        start_date:     memberSubscriptions.start_date,
        end_date:       memberSubscriptions.end_date,
        billing_cycle:  membershipPlans.billing_cycle,
        price:          membershipPlans.price,
      })
      .from(payments)
      .leftJoin(members, eq(payments.member_id, members.id))
      .leftJoin(profiles, eq(members.profile_id, profiles.id))
      .leftJoin(memberSubscriptions, eq(payments.subscription_id, memberSubscriptions.id))
      .leftJoin(membershipPlans, eq(memberSubscriptions.plan_id, membershipPlans.id))
      .where(eq(payments.id, id))
      .limit(1);

    const p = rows[0];
    if (!p) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    return NextResponse.json({
      payment: {
        id: p.id, amount: p.amount, payment_method: p.payment_method,
        payment_date: p.payment_date, reference_no: p.reference_no,
        notes: p.notes, created_at: p.created_at,
        member: {
          id: p.member_id, member_number: p.member_number,
          profile: { first_name: p.first_name, last_name: p.last_name, email: p.email },
        },
        subscription: p.sub_id ? {
          id: p.sub_id, start_date: p.start_date, end_date: p.end_date,
          plan: { billing_cycle: p.billing_cycle, price: p.price },
        } : null,
      },
    });
  } catch (err) {
    console.error('[api/admin/payments/[id]]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
