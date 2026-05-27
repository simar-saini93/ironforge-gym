import { NextResponse }    from 'next/server';
import { drizzleDb }       from '@/db/index';
import { membershipPlans } from '@/db/schema';
import { eq, asc }         from 'drizzle-orm';

export async function GET() {
  try {
    const plans = await drizzleDb
      .select({
        id:            membershipPlans.id,
        billing_cycle: membershipPlans.billing_cycle,
        price:         membershipPlans.price,
        is_active:     membershipPlans.is_active,
      })
      .from(membershipPlans)
      .where(eq(membershipPlans.is_active, true))
      .orderBy(asc(membershipPlans.price));

    return NextResponse.json({ plans }, { status: 200 });
  } catch (err) {
    console.error('[api/plans] Error:', err?.message);
    return NextResponse.json({ plans: [] }, { status: 200 });
  }
}
