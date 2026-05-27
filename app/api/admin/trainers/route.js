import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import { trainers, profiles, memberTrainerAssignments, branches } from '@/db/schema';
import { eq, and, ilike, or, desc, count, sql } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

const PAGE_SIZE = 15;

const querySchema = z.object({
  page:   z.coerce.number().min(1).default(1),
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
      page:   searchParams.get('page'),
      search: searchParams.get('search') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const { page, search } = parsed.data;
    const offset = (page - 1) * PAGE_SIZE;

    const conditions = [];
    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(or(
        ilike(profiles.first_name, q),
        ilike(profiles.last_name,  q),
        ilike(profiles.email,      q),
      ));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      drizzleDb
        .select({
          id:             trainers.id,
          is_active:      trainers.is_active,
          specialization: trainers.specialization,
          created_at:     trainers.created_at,
          first_name:     profiles.first_name,
          last_name:      profiles.last_name,
          email:          profiles.email,
          phone:          profiles.phone,
          active_members: sql`(
            SELECT COUNT(*) FROM member_trainer_assignments
            WHERE trainer_id = ${trainers.id} AND is_active = true
          )`.mapWith(Number),
        })
        .from(trainers)
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .where(where)
        .orderBy(desc(trainers.created_at))
        .limit(PAGE_SIZE)
        .offset(offset),

      drizzleDb
        .select({ count: count() })
        .from(trainers)
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .where(where),
    ]);

    const formatted = rows.map((t) => ({
      id:             t.id,
      is_active:      t.is_active,
      specialization: t.specialization,
      created_at:     t.created_at,
      profile: {
        first_name: t.first_name,
        last_name:  t.last_name,
        email:      t.email,
        phone:      t.phone,
      },
      active_members: t.active_members,
    }));

    return NextResponse.json({
      trainers: formatted,
      total:    countResult[0]?.count ?? 0,
      page,
    }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });

  } catch (err) {
    console.error('[api/admin/trainers] error:', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — create trainer ─────────────────────────────────────
export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(10, userId); }
    catch { return rateLimitResponse(10); }

    const { email, first_name, last_name, phone, specialization, bio } = await request.json();
    if (!email || !first_name) return NextResponse.json({ error: 'Email and first name required' }, { status: 400 });

    // Send Clerk invite directly (no relative fetch in API routes)
    const client     = await clerkClient();
    const existing   = await client.users.getUserList({ emailAddress: [email] });
    if (existing.totalCount > 0) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }

    const invitation = await client.invitations.createInvitation({
      emailAddress:   email,
      redirectUrl:    `${process.env.NEXT_PUBLIC_APP_URL}/set-password`,
      publicMetadata: { role: 'trainer' },
      ignoreExisting: true,
    });

    const authUserId = invitation.id;
    const branchRow  = await drizzleDb.select({ id: branches.id }).from(branches).limit(1);
    const branchId   = branchRow[0]?.id;

    await drizzleDb.insert(profiles).values({ id: authUserId, branch_id: branchId, role: 'trainer', first_name: first_name.trim(), last_name: last_name?.trim() || null, email: email.trim().toLowerCase(), phone: phone || null });
    await drizzleDb.insert(trainers).values({ profile_id: authUserId, branch_id: branchId, specialization: specialization || null, bio: bio || null, is_active: true });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/trainers POST]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
