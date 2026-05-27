import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import { members, payments } from '@/db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import { memberLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const PAGE_SIZE = 20;

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try { await memberLimiter.check(45, userId); }
    catch { return rateLimitResponse(45); }

    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, Number(searchParams.get('page') || 1));
    const offset = (page - 1) * PAGE_SIZE;

    const memberRows = await drizzleDb.select({ id: members.id }).from(members).where(eq(members.profile_id, userId)).limit(1);
    const member = memberRows[0];
    if (!member) return NextResponse.json({ payments: [], total: 0, page, pages: 0 });

    const [rows, countRows, sumRows] = await Promise.all([
      drizzleDb
        .select({ id: payments.id, amount: payments.amount, payment_method: payments.payment_method, payment_date: payments.payment_date, reference_no: payments.reference_no })
        .from(payments).where(eq(payments.member_id, member.id))
        .orderBy(desc(payments.payment_date)).limit(PAGE_SIZE).offset(offset),

      drizzleDb.select({ count: count() }).from(payments).where(eq(payments.member_id, member.id)),

      drizzleDb.select({ total: sql`COALESCE(SUM(${payments.amount}), 0)` }).from(payments).where(eq(payments.member_id, member.id)),
    ]);

    const total     = Number(sumRows[0]?.total || 0);
    const totalRows = countRows[0]?.count ?? 0;

    return NextResponse.json({
      payments: rows, total, page, pages: Math.ceil(totalRows / PAGE_SIZE),
    }, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } });
  } catch (err) {
    console.error('[api/member/payments]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
