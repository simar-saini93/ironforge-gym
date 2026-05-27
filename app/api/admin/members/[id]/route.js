import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import {
  members, memberSubscriptions, membershipPlans,
  profiles, payments, branches,
} from '@/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

function calcEndDate(startDate, billingCycle) {
  const d = new Date(startDate + 'T00:00:00');
  if      (billingCycle === 'monthly')  d.setMonth(d.getMonth() + 1);
  else if (billingCycle === 'yearly')   d.setFullYear(d.getFullYear() + 1);
  else if (billingCycle === 'weekly')   d.setDate(d.getDate() + 7);
  else                                  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ── GET — member detail ──────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    const { id } = await params;
    const { payments: paymentsTable, accessLogs: accessLogsTable, memberTrainerAssignments, trainers } = await import('@/db/schema');

    const [memberRows, subRows, paymentRows, logRows, trainerRows] = await Promise.all([
      drizzleDb.select({
        id: members.id, member_number: members.member_number, profile_id: members.profile_id,
        profile_pic_url: members.profile_pic_url, is_active: members.is_active,
        date_of_birth: members.date_of_birth, gender: members.gender,
        address: members.address, emergency_name: members.emergency_name,
        emergency_phone: members.emergency_phone, created_at: members.created_at,
        first_name: profiles.first_name, last_name: profiles.last_name,
        email: profiles.email, phone: profiles.phone,
      }).from(members).leftJoin(profiles, eq(members.profile_id, profiles.id)).where(eq(members.id, id)).limit(1),

      drizzleDb.select({
        id: memberSubscriptions.id, status: memberSubscriptions.status,
        start_date: memberSubscriptions.start_date, end_date: memberSubscriptions.end_date,
        billing_cycle: membershipPlans.billing_cycle, price: membershipPlans.price,
      }).from(memberSubscriptions)
        .leftJoin(membershipPlans, eq(memberSubscriptions.plan_id, membershipPlans.id))
        .where(and(eq(memberSubscriptions.member_id, id), inArray(memberSubscriptions.status, ['active', 'frozen'])))
        .orderBy(desc(memberSubscriptions.end_date)).limit(1),

      drizzleDb.select({
        id: paymentsTable.id, amount: paymentsTable.amount,
        payment_method: paymentsTable.payment_method, payment_date: paymentsTable.payment_date,
        reference_no: paymentsTable.reference_no, notes: paymentsTable.notes,
      }).from(paymentsTable).where(eq(paymentsTable.member_id, id)).orderBy(desc(paymentsTable.payment_date)).limit(10),

      drizzleDb.select({
        id: accessLogsTable.id, method: accessLogsTable.method,
        status: accessLogsTable.status, accessed_at: accessLogsTable.accessed_at,
        denied_reason: accessLogsTable.denied_reason,
      }).from(accessLogsTable).where(eq(accessLogsTable.member_id, id)).orderBy(desc(accessLogsTable.accessed_at)).limit(10),

      drizzleDb.select({
        is_active: memberTrainerAssignments.is_active,
        trainer_id: memberTrainerAssignments.trainer_id,
        first_name: profiles.first_name, last_name: profiles.last_name,
      }).from(memberTrainerAssignments)
        .leftJoin(trainers, eq(memberTrainerAssignments.trainer_id, trainers.id))
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .where(eq(memberTrainerAssignments.member_id, id)),
    ]);

    const member = memberRows[0] ?? null;
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const activeSub = subRows[0] ? {
      id: subRows[0].id, status: subRows[0].status,
      start_date: subRows[0].start_date, end_date: subRows[0].end_date,
      plan: { billing_cycle: subRows[0].billing_cycle, price: subRows[0].price },
    } : null;

    return NextResponse.json({
      member: {
        ...member,
        profile: { first_name: member.first_name, last_name: member.last_name, email: member.email, phone: member.phone },
        subscription: activeSub ? [activeSub] : [],
        trainer: trainerRows.map((t) => ({ is_active: t.is_active, trainer: { profile: { first_name: t.first_name, last_name: t.last_name } } })),
      },
      activeSub,
      payments: paymentRows,
      accessLogs: logRows,
    });
  } catch (err) {
    console.error('[api/admin/members/[id] GET]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — renew subscription ─────────────────────────────────
const renewSchema = z.object({
  plan_id:        z.string().uuid(),
  start_date:     z.string(),
  amount_paid:    z.coerce.number().min(0),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'other']),
  reference_no:   z.string().max(100).optional().nullable(),
  notes:          z.string().max(1000).optional().nullable(),
  active_sub_id:  z.string().uuid().optional().nullable(),
});

export async function POST(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(20, userId); }
    catch { return rateLimitResponse(20); }

    const { id }   = await params;
    const body     = await request.json();
    const parsed   = renewSchema.safeParse(body);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const d = parsed.data;

    const branchResult = await drizzleDb.select({ id: branches.id }).from(branches).limit(1);
    const branchId = branchResult[0]?.id;

    const planRow = await drizzleDb.select({ billing_cycle: membershipPlans.billing_cycle }).from(membershipPlans).where(eq(membershipPlans.id, d.plan_id)).limit(1);
    const cycle   = planRow[0]?.billing_cycle;
    const endDate = calcEndDate(d.start_date, cycle);

    // Mark current sub as completed
    if (d.active_sub_id) {
      await drizzleDb.update(memberSubscriptions).set({ status: 'completed' }).where(eq(memberSubscriptions.id, d.active_sub_id));
    }

    // Create new subscription
    const [sub] = await drizzleDb.insert(memberSubscriptions).values({
      member_id: id, plan_id: d.plan_id, branch_id: branchId,
      start_date: d.start_date, end_date: endDate,
      status: 'active', renewed_by: userId, notes: d.notes || null,
    }).returning();

    // Record payment
    const [payment] = await drizzleDb.insert(payments).values({
      member_id: id, subscription_id: sub.id, branch_id: branchId,
      amount: d.amount_paid, payment_method: d.payment_method,
      reference_no: d.reference_no || null, recorded_by: userId, notes: d.notes || null,
    }).returning();

    return NextResponse.json({ success: true, paymentId: payment.id, subId: sub.id }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/members/[id] POST]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT — edit member ─────────────────────────────────────────
const editSchema = z.object({
  first_name:      z.string().min(1).max(100).trim().optional(),
  last_name:       z.string().max(100).trim().optional().nullable(),
  phone:           z.string().max(20).trim().optional().nullable(),
  dob:             z.string().optional().nullable(),
  gender:          z.enum(['male','female','other']).optional().nullable(),
  address:         z.string().max(500).optional().nullable(),
  emergency_name:  z.string().max(100).optional().nullable(),
  emergency_phone: z.string().max(20).optional().nullable(),
  profile_pic_url: z.string().url().optional().nullable(),
  is_active:       z.boolean().optional(),
});

export async function PUT(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(20, userId); }
    catch { return rateLimitResponse(20); }

    const { id }   = await params;
    const body     = await request.json();
    const parsed   = editSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const d = parsed.data;

    // Get profile_id from member
    const memberRow = await drizzleDb.select({ profile_id: members.profile_id }).from(members).where(eq(members.id, id)).limit(1);
    const profileId = memberRow[0]?.profile_id;

    // ── Profile fields ────────────────────────────────────────
    const profileSet = {
      ...(d.first_name !== undefined && { first_name: d.first_name }),
      ...(d.last_name  !== undefined && { last_name:  d.last_name  }),
      ...(d.phone      !== undefined && { phone:      d.phone      }),
    };

    // ── Member fields ─────────────────────────────────────────
    const memberSet = {
      ...(d.dob             !== undefined && { date_of_birth:   d.dob             }),
      ...(d.gender          !== undefined && { gender:          d.gender          }),
      ...(d.address         !== undefined && { address:         d.address         }),
      ...(d.emergency_name  !== undefined && { emergency_name:  d.emergency_name  }),
      ...(d.emergency_phone !== undefined && { emergency_phone: d.emergency_phone }),
      ...(d.profile_pic_url !== undefined && { profile_pic_url: d.profile_pic_url }),
      ...(d.is_active       !== undefined && { is_active:       d.is_active       }),
    };

    // Only run updates if there are fields to set
    const ops = [];
    if (profileId && Object.keys(profileSet).length > 0) {
      ops.push(drizzleDb.update(profiles).set(profileSet).where(eq(profiles.id, profileId)));
    }
    if (Object.keys(memberSet).length > 0) {
      ops.push(drizzleDb.update(members).set(memberSet).where(eq(members.id, id)));
    }

    if (ops.length > 0) await Promise.all(ops);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/members/[id] PUT]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE — delete member + all related data ─────────────────
export async function DELETE(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(5, userId); }
    catch { return rateLimitResponse(5); }

    const { id } = await params;

    const { memberTrainerAssignments, accessLogs: accessLogsTable, payments: paymentsTable } = await import('@/db/schema');

    const memberRow = await drizzleDb.select({ profile_id: members.profile_id }).from(members).where(eq(members.id, id)).limit(1);
    const profileId = memberRow[0]?.profile_id;

    await drizzleDb.delete(memberTrainerAssignments).where(eq(memberTrainerAssignments.member_id, id));
    await drizzleDb.delete(accessLogsTable).where(eq(accessLogsTable.member_id, id));
    await drizzleDb.delete(paymentsTable).where(eq(paymentsTable.member_id, id));
    await drizzleDb.delete(memberSubscriptions).where(eq(memberSubscriptions.member_id, id));
    await drizzleDb.delete(members).where(eq(members.id, id));
    if (profileId) await drizzleDb.delete(profiles).where(eq(profiles.id, profileId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/members/[id] DELETE]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
