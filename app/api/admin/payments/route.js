import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import { payments, members, profiles } from '@/db/schema';
import { eq, and, ilike, or, desc, count, sum, sql } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const PAGE_SIZE = 20;

const querySchema = z.object({
  page:   z.coerce.number().min(1).default(1),
  search: z.string().max(100).optional(),
  method: z.enum(['cash', 'card', 'bank_transfer', 'other', '']).optional(),
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
      method: searchParams.get('method') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const { page, search, method } = parsed.data;
    const offset = (page - 1) * PAGE_SIZE;

    const conditions = [];
    if (method) conditions.push(eq(payments.payment_method, method));
    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(or(
        ilike(profiles.first_name,    q),
        ilike(profiles.last_name,     q),
        ilike(members.member_number,  q),
        ilike(payments.reference_no,  q),
      ));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult, summaryResult] = await Promise.all([
      drizzleDb
        .select({
          id:             payments.id,
          amount:         payments.amount,
          payment_method: payments.payment_method,
          payment_date:   payments.payment_date,
          reference_no:   payments.reference_no,
          notes:          payments.notes,
          member_number:  members.member_number,
          first_name:     profiles.first_name,
          last_name:      profiles.last_name,
          email:          profiles.email,
        })
        .from(payments)
        .leftJoin(members, eq(payments.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .where(where)
        .orderBy(desc(payments.payment_date))
        .limit(PAGE_SIZE)
        .offset(offset),

      drizzleDb
        .select({ count: count() })
        .from(payments)
        .leftJoin(members, eq(payments.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .where(where),

      drizzleDb
        .select({ total: sql`COALESCE(SUM(amount::numeric), 0)`.mapWith(Number) })
        .from(payments)
        .leftJoin(members, eq(payments.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .where(where),
    ]);

    const formatted = rows.map((p) => ({
      id:             p.id,
      amount:         p.amount,
      payment_method: p.payment_method,
      payment_date:   p.payment_date,
      reference_no:   p.reference_no,
      notes:          p.notes,
      member: {
        member_number: p.member_number,
        profile: { first_name: p.first_name, last_name: p.last_name, email: p.email },
      },
    }));

    const totalRevenue = summaryResult[0]?.total ?? 0;
    const totalCount   = countResult[0]?.count   ?? 0;

    return NextResponse.json({
      payments: formatted,
      total:    totalCount,
      summary:  { total: totalRevenue, count: totalCount },
      page,
    }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });

  } catch (err) {
    console.error('[api/admin/payments] error:', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
