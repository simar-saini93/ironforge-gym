import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import { membershipPlans, profiles } from '@/db/schema';
import { eq, asc }       from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const planSchema = z.object({
  billing_cycle: z.enum(['day_pass', 'weekly', 'monthly', 'yearly']),
  price:         z.coerce.number().min(0),
  description:   z.string().max(200).optional().nullable(),
  is_active:     z.boolean().default(true),
});

async function getBranchId(userId) {
  const result = await drizzleDb
    .select({ branch_id: profiles.branch_id })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return result[0]?.branch_id ?? null;
}

export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    const branchId = await getBranchId(userId);
    if (!branchId) return NextResponse.json({ plans: [] });

    const plans = await drizzleDb
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.branch_id, branchId))
      .orderBy(asc(membershipPlans.price));

    return NextResponse.json({ plans }, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (err) {
    console.error('[settings/plans GET]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(20, userId); }
    catch { return rateLimitResponse(20); }

    const body   = await request.json();
    const parsed = planSchema.safeParse(body);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const branchId = await getBranchId(userId);
    if (!branchId) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    const [plan] = await drizzleDb
      .insert(membershipPlans)
      .values({ ...parsed.data, branch_id: branchId })
      .returning();

    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    console.error('[settings/plans POST]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(20, userId); }
    catch { return rateLimitResponse(20); }

    const { id, ...rest } = await request.json();
    if (!id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });

    const parsed = planSchema.partial().safeParse(rest);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      return NextResponse.json({ error: first }, { status: 400 });
    }

    await drizzleDb
      .update(membershipPlans)
      .set({ ...parsed.data, updated_at: new Date() })
      .where(eq(membershipPlans.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[settings/plans PUT]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(20, userId); }
    catch { return rateLimitResponse(20); }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });

    await drizzleDb.delete(membershipPlans).where(eq(membershipPlans.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[settings/plans DELETE]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
