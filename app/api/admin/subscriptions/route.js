import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import { memberSubscriptions, membershipPlans, members, profiles } from '@/db/schema';
import { eq, and, ilike, or, desc, count } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const PAGE_SIZE = 20;

const querySchema = z.object({
  page:   z.coerce.number().min(1).default(1),
  search: z.string().max(100).optional(),
  status: z.enum(['active', 'expired', 'frozen', '']).optional(),
});

export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      page:   searchParams.get('page'),
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
    });

    if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

    const { page, search, status } = parsed.data;
    const offset = (page - 1) * PAGE_SIZE;

    const conditions = [];
    if (status) conditions.push(eq(memberSubscriptions.status, status));
    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(or(ilike(profiles.first_name, q), ilike(profiles.last_name, q), ilike(members.member_number, q)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      drizzleDb
        .select({
          id:            memberSubscriptions.id,
          status:        memberSubscriptions.status,
          start_date:    memberSubscriptions.start_date,
          end_date:      memberSubscriptions.end_date,
          billing_cycle: membershipPlans.billing_cycle,
          price:         membershipPlans.price,
          member_id:     members.id,
          member_number: members.member_number,
          first_name:    profiles.first_name,
          last_name:     profiles.last_name,
        })
        .from(memberSubscriptions)
        .leftJoin(membershipPlans, eq(memberSubscriptions.plan_id, membershipPlans.id))
        .leftJoin(members, eq(memberSubscriptions.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .where(where)
        .orderBy(desc(memberSubscriptions.created_at))
        .limit(PAGE_SIZE)
        .offset(offset),

      drizzleDb
        .select({ count: count() })
        .from(memberSubscriptions)
        .leftJoin(members, eq(memberSubscriptions.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .where(where),
    ]);

    const formatted = rows.map((s) => ({
      id: s.id, status: s.status, start_date: s.start_date, end_date: s.end_date,
      plan: { billing_cycle: s.billing_cycle, price: s.price },
      member: { id: s.member_id, member_number: s.member_number, profile: { first_name: s.first_name, last_name: s.last_name } },
    }));

    return NextResponse.json({ subs: formatted, total: countResult[0]?.count ?? 0, page }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });

  } catch (err) {
    console.error('[api/admin/subscriptions GET]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH — freeze/unfreeze ───────────────────────────────────
export async function PATCH(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(30, userId); }
    catch { return rateLimitResponse(30); }

    const { id, status } = await request.json();
    if (!id || !['active', 'frozen'].includes(status)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Get current subscription
    const subRows = await drizzleDb
      .select({ status: memberSubscriptions.status, end_date: memberSubscriptions.end_date, frozen_at: memberSubscriptions.frozen_at })
      .from(memberSubscriptions)
      .where(eq(memberSubscriptions.id, id))
      .limit(1);

    const sub = subRows[0];
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    if (status === 'frozen') {
      // ── FREEZE: store frozen_at timestamp ─────────────────
      await drizzleDb.update(memberSubscriptions)
        .set({ status: 'frozen', frozen_at: new Date() })
        .where(eq(memberSubscriptions.id, id));

    } else if (status === 'active') {
      // ── UNFREEZE: extend end_date by frozen days ──────────
      let newEndDate = sub.end_date;

      if (sub.frozen_at) {
        const frozenAt  = new Date(sub.frozen_at);
        const now       = new Date();
        const frozenMs  = now.getTime() - frozenAt.getTime();
        const frozenDays = Math.ceil(frozenMs / (1000 * 60 * 60 * 24));

        // Extend end_date
        const currentEnd = new Date(sub.end_date + 'T00:00:00');
        currentEnd.setDate(currentEnd.getDate() + frozenDays);
        newEndDate = currentEnd.toISOString().split('T')[0];
      }

      await drizzleDb.update(memberSubscriptions)
        .set({ status: 'active', frozen_at: null, end_date: newEndDate })
        .where(eq(memberSubscriptions.id, id));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/subscriptions PATCH]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
