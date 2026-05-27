import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import {
  members, memberSubscriptions, membershipPlans,
  profiles, branches, payments, auditLogs, pendingInvitations,
} from '@/db/schema';
import { eq, and, ilike, or, desc, count, sql, inArray } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const PAGE_SIZE = 15;

// ── GET — list members ────────────────────────────────────────
const querySchema = z.object({
  page:   z.coerce.number().min(1).default(1),
  search: z.string().max(100).optional(),
  status: z.enum(['active', 'expired', 'frozen', 'inactive', '']).optional(),
  plan:   z.enum(['day_pass', 'weekly', 'monthly', 'yearly', '']).optional(),
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
      plan:   searchParams.get('plan')   || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const { page, search, status, plan } = parsed.data;
    const offset = (page - 1) * PAGE_SIZE;
    const today  = new Date().toISOString().split('T')[0];

    const conditions = [];
    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(or(ilike(members.member_number, q), ilike(profiles.first_name, q), ilike(profiles.last_name, q), ilike(profiles.email, q)));
    }
    if (plan) conditions.push(eq(membershipPlans.billing_cycle, plan));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      drizzleDb
        .select({
          id: members.id, member_number: members.member_number,
          profile_pic_url: members.profile_pic_url, is_active: members.is_active, created_at: members.created_at,
          first_name: profiles.first_name, last_name: profiles.last_name, email: profiles.email, phone: profiles.phone,
          sub_status: memberSubscriptions.status, sub_start: memberSubscriptions.start_date,
          sub_end: memberSubscriptions.end_date, billing_cycle: membershipPlans.billing_cycle, plan_price: membershipPlans.price,
        })
        .from(members)
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .leftJoin(memberSubscriptions, and(
          eq(memberSubscriptions.member_id, members.id),
          inArray(memberSubscriptions.status, ['active', 'frozen', 'expired'])
        ))
        .leftJoin(membershipPlans, eq(memberSubscriptions.plan_id, membershipPlans.id))
        .where(where).orderBy(desc(members.created_at)).limit(PAGE_SIZE).offset(offset),

      drizzleDb.select({ count: count() }).from(members)
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .leftJoin(memberSubscriptions, and(
          eq(memberSubscriptions.member_id, members.id),
          inArray(memberSubscriptions.status, ['active', 'frozen', 'expired'])
        ))
        .leftJoin(membershipPlans, eq(memberSubscriptions.plan_id, membershipPlans.id))
        .where(where),
    ]);

    let formatted = rows.map((m) => {
      let realStatus = null;
      if (!m.is_active)                   realStatus = 'inactive';
      else if (m.sub_status === 'frozen') realStatus = 'frozen';
      else if (m.sub_end)                 realStatus = m.sub_end < today ? 'expired' : 'active';
      return {
        id: m.id, member_number: m.member_number, profile_pic_url: m.profile_pic_url,
        is_active: m.is_active, created_at: m.created_at, realStatus,
        profile: { first_name: m.first_name, last_name: m.last_name, email: m.email, phone: m.phone },
        subscription: m.sub_end ? [{ status: m.sub_status, start_date: m.sub_start, end_date: m.sub_end, plan: { billing_cycle: m.billing_cycle, price: m.plan_price } }] : [],
      };
    });

    if (status) formatted = formatted.filter((m) => m.realStatus === status);

    return NextResponse.json({ members: formatted, total: countResult[0]?.count ?? 0, page, pages: Math.ceil((countResult[0]?.count ?? 0) / PAGE_SIZE) }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('[api/admin/members GET]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — create member ──────────────────────────────────────
const createMemberSchema = z.object({
  first_name:      z.string().min(1).max(100).trim(),
  last_name:       z.string().max(100).trim().optional().nullable(),
  email:           z.string().email().trim(),
  phone:           z.string().max(20).trim().optional().nullable(),
  dob:             z.string().optional().nullable(),
  gender:          z.enum(['male','female','other']).optional().nullable(),
  address:         z.string().max(500).optional().nullable(),
  emergency_name:  z.string().max(100).optional().nullable(),
  emergency_phone: z.string().max(20).optional().nullable(),
  profile_pic_url: z.string().url().optional().nullable(),
  plan_id:         z.string().uuid(),
  start_date:      z.string(),
  amount_paid:     z.coerce.number().min(0),
  payment_method:  z.enum(['cash','card','bank_transfer','other']),
  reference_no:    z.string().max(100).optional().nullable(),
  notes:           z.string().max(1000).optional().nullable(),
  lead_id:         z.string().uuid().optional().nullable(),
  clerk_invite_id: z.string().min(1),
});

export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(10, userId); }
    catch { return rateLimitResponse(10); }

    const body   = await request.json();
    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const d = parsed.data;

    const branchResult = await drizzleDb.select({ id: branches.id }).from(branches).limit(1);
    const branchId = branchResult[0]?.id;
    if (!branchId) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });

    const countResult  = await drizzleDb.select({ count: count() }).from(members);
    const memberNumber = `IGF-${String((countResult[0]?.count || 0) + 1).padStart(5, '0')}`;

    // Store pending invitation
    await drizzleDb.insert(pendingInvitations).values({
      email: d.email.trim().toLowerCase(), first_name: d.first_name.trim(),
      clerk_invite_id: d.clerk_invite_id, branch_id: branchId,
    }).onConflictDoUpdate({ target: pendingInvitations.email, set: { clerk_invite_id: d.clerk_invite_id } });

    // Create placeholder profile (webhook will update on member signup)
    await drizzleDb.insert(profiles).values({
      id:         d.clerk_invite_id,
      branch_id:  branchId,
      role:       'member',
      first_name: d.first_name.trim(),
      last_name:  d.last_name?.trim() || '',
      email:      d.email.trim().toLowerCase(),
      phone:      d.phone || null,
      is_active:  true,
    }).onConflictDoNothing();

    // Calculate end date from plan
    const planRow = await drizzleDb.select({ billing_cycle: membershipPlans.billing_cycle }).from(membershipPlans).where(eq(membershipPlans.id, d.plan_id)).limit(1);
    const cycle   = planRow[0]?.billing_cycle;
    const start   = new Date(d.start_date);
    const end     = new Date(start);
    if      (cycle === 'monthly') end.setMonth(end.getMonth() + 1);
    else if (cycle === 'yearly')  end.setFullYear(end.getFullYear() + 1);
    else if (cycle === 'weekly')  end.setDate(end.getDate() + 7);
    else                          end.setDate(end.getDate() + 1);

    const [member] = await drizzleDb.insert(members).values({
      profile_id:      d.clerk_invite_id,
      branch_id:       branchId,
      member_number:   memberNumber,
      profile_pic_url: d.profile_pic_url || null,
      date_of_birth:   d.dob    || null,
      gender:          d.gender || null,
      address:         d.address || null,
      emergency_name:  d.emergency_name  || null,
      emergency_phone: d.emergency_phone || null,
      qr_token:        randomUUID(),
      is_active:       true,
    }).returning();

    const [sub] = await drizzleDb.insert(memberSubscriptions).values({
      member_id: member.id, plan_id: d.plan_id, branch_id: branchId,
      start_date: d.start_date, end_date: end.toISOString().split('T')[0],
      status: 'active', renewed_by: userId, notes: d.notes || null,
    }).returning();

    const [payment] = await drizzleDb.insert(payments).values({
      member_id: member.id, subscription_id: sub.id, branch_id: branchId,
      amount: d.amount_paid, payment_method: d.payment_method,
      reference_no: d.reference_no || null, recorded_by: userId, notes: d.notes || null,
    }).returning();

    await drizzleDb.insert(auditLogs).values({
      branch_id: branchId, profile_id: userId, action: 'MEMBER_CREATED',
      entity: 'members', entity_id: member.id,
      new_value: { member_number: memberNumber, email: d.email },
    }).catch(() => {});

    return NextResponse.json({ memberId: member.id, paymentId: payment.id }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/members POST]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
