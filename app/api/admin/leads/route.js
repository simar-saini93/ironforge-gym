import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import { leads, branches } from '@/db/schema';
import { eq, and, inArray, ilike, or, desc, count } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const PAGE_SIZE    = 15;
const ACTIVE_STATS = ['new', 'contacted', 'interested'];

const querySchema = z.object({
  page:    z.coerce.number().min(1).default(1),
  search:  z.string().max(100).optional(),
  source:  z.string().max(50).optional(),
  showAll: z.enum(['true', 'false']).default('false'),
});

const createLeadSchema = z.object({
  first_name: z.string().min(1).max(100).trim(),
  last_name:  z.string().max(100).trim().optional().nullable(),
  email:      z.string().email().trim().optional().nullable(),
  phone:      z.string().max(20).trim().optional().nullable(),
  source:     z.string().min(1),
  status:     z.enum(['new', 'contacted', 'interested']).default('new'),
  notes:      z.string().max(1000).trim().optional().nullable(),
});

async function getBranchId() {
  const result = await drizzleDb.select({ id: branches.id }).from(branches).limit(1);
  return result[0]?.id ?? null;
}

// ── GET — list leads ──────────────────────────────────────────
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
      page:    searchParams.get('page'),
      search:  searchParams.get('search') || undefined,
      source:  searchParams.get('source') || undefined,
      showAll: searchParams.get('showAll') || 'false',
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const { page, search, source, showAll } = parsed.data;
    const offset   = (page - 1) * PAGE_SIZE;
    const statuses = showAll === 'true' ? [...ACTIVE_STATS, 'lost'] : ACTIVE_STATS;

    const conditions = [inArray(leads.status, statuses)];
    if (source) conditions.push(eq(leads.source, source));
    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(or(ilike(leads.first_name, q), ilike(leads.last_name, q)));
    }

    const where = and(...conditions);

    const [rows, countResult, newCountResult] = await Promise.all([
      drizzleDb
        .select({ id: leads.id, first_name: leads.first_name, last_name: leads.last_name, email: leads.email, phone: leads.phone, source: leads.source, status: leads.status, notes: leads.notes, created_at: leads.created_at, converted_member_id: leads.converted_member_id })
        .from(leads).where(where).orderBy(desc(leads.created_at)).limit(PAGE_SIZE).offset(offset),
      drizzleDb.select({ count: count() }).from(leads).where(where),
      drizzleDb.select({ count: count() }).from(leads).where(eq(leads.status, 'new')),
    ]);

    return NextResponse.json({
      leads:    rows,
      total:    countResult[0]?.count ?? 0,
      newCount: newCountResult[0]?.count ?? 0,
      page,
    }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });

  } catch (err) {
    console.error('[api/admin/leads GET]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — create lead ────────────────────────────────────────
export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(30, userId); }
    catch { return rateLimitResponse(30); }

    const body   = await request.json();
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const branchId = await getBranchId();
    if (!branchId) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    const [lead] = await drizzleDb.insert(leads).values({ ...parsed.data, branch_id: branchId }).returning();

    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/leads POST]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
