import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import { accessLogs, members, profiles } from '@/db/schema';
import { eq, and, desc, count, ilike, or } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const PAGE_SIZE = 25;

const querySchema = z.object({
  page:   z.coerce.number().min(1).default(1),
  status: z.enum(['granted', 'denied', '']).optional(),
  method: z.enum(['qr', 'daily_code', '']).optional(),
  search: z.string().max(100).optional(),
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
      page:   searchParams.get('page')   || 1,
      status: searchParams.get('status') || undefined,
      method: searchParams.get('method') || undefined,
      search: searchParams.get('search') || undefined,
    });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

    const { page, status, method, search } = parsed.data;
    const offset = (page - 1) * PAGE_SIZE;

    const conditions = [];
    if (status) conditions.push(eq(accessLogs.status, status));
    if (method) conditions.push(eq(accessLogs.method, method));
    if (search?.trim()) {
      const pat = `%${search.trim()}%`;
      conditions.push(or(
        ilike(profiles.first_name,   pat),
        ilike(profiles.last_name,    pat),
        ilike(members.member_number, pat),
      ));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      drizzleDb
        .select({
          id:            accessLogs.id,
          method:        accessLogs.method,
          status:        accessLogs.status,
          accessed_at:   accessLogs.accessed_at,
          denied_reason: accessLogs.denied_reason,
          device_id:     accessLogs.device_id,
          member_id:     members.id,
          member_number: members.member_number,
          first_name:    profiles.first_name,
          last_name:     profiles.last_name,
        })
        .from(accessLogs)
        .leftJoin(members,  eq(accessLogs.member_id,  members.id))
        .leftJoin(profiles, eq(members.profile_id,    profiles.id))
        .where(where)
        .orderBy(desc(accessLogs.accessed_at))
        .limit(PAGE_SIZE)
        .offset(offset),

      drizzleDb
        .select({ count: count() })
        .from(accessLogs)
        .leftJoin(members,  eq(accessLogs.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id,   profiles.id))
        .where(where),
    ]);

    const logs = rows.map((l) => ({
      id:            l.id,
      method:        l.method,
      status:        l.status,
      accessed_at:   l.accessed_at,
      denied_reason: l.denied_reason,
      device_id:     l.device_id,
      member: {
        id:            l.member_id,
        member_number: l.member_number,
        profile:       { first_name: l.first_name, last_name: l.last_name },
      },
    }));

    return NextResponse.json({
      logs,
      total: countResult[0]?.count ?? 0,
      page,
      pages: Math.ceil((countResult[0]?.count ?? 0) / PAGE_SIZE),
    }, {
      headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' },
    });
  } catch (err) {
    console.error('[api/admin/access-logs]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
