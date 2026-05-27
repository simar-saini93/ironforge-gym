import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import { members, accessLogs } from '@/db/schema';
import { eq, and, gte, desc, count } from 'drizzle-orm';
import { memberLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

const PAGE_SIZE = 50;

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
    if (!member) return NextResponse.json({ logs: [], thisMonth: 0, page, pages: 0 });

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [logs, totalRows, monthCount] = await Promise.all([
      drizzleDb
        .select({ id: accessLogs.id, method: accessLogs.method, status: accessLogs.status, accessed_at: accessLogs.accessed_at })
        .from(accessLogs)
        .where(and(eq(accessLogs.member_id, member.id), eq(accessLogs.status, 'granted')))
        .orderBy(desc(accessLogs.accessed_at)).limit(PAGE_SIZE).offset(offset),

      drizzleDb.select({ count: count() }).from(accessLogs)
        .where(and(eq(accessLogs.member_id, member.id), eq(accessLogs.status, 'granted'))),

      drizzleDb.select({ count: count() }).from(accessLogs)
        .where(and(eq(accessLogs.member_id, member.id), eq(accessLogs.status, 'granted'), gte(accessLogs.accessed_at, startOfMonth))),
    ]);

    return NextResponse.json({
      logs, thisMonth: monthCount[0]?.count ?? 0,
      page, pages: Math.ceil((totalRows[0]?.count ?? 0) / PAGE_SIZE),
    }, { headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=40' } });
  } catch (err) {
    console.error('[api/member/attendance]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
