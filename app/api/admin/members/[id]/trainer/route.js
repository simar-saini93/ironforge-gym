import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import { memberTrainerAssignments, trainers, profiles, branches } from '@/db/schema';
import { eq, and }       from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

// ── GET — active trainers list ────────────────────────────────
export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    const rows = await drizzleDb
      .select({ id: trainers.id, first_name: profiles.first_name, last_name: profiles.last_name })
      .from(trainers)
      .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
      .where(eq(trainers.is_active, true));

    return NextResponse.json({ trainers: rows.map((t) => ({ id: t.id, profile: { first_name: t.first_name, last_name: t.last_name } })) });
  } catch (err) {
    console.error('[trainer GET]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — assign / unassign trainer ─────────────────────────
export async function POST(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(20, userId); }
    catch { return rateLimitResponse(20); }

    const { id }     = await params;
    const { action, trainer_id } = await request.json();

    // Deactivate existing assignments
    await drizzleDb.update(memberTrainerAssignments)
      .set({ is_active: false })
      .where(and(eq(memberTrainerAssignments.member_id, id), eq(memberTrainerAssignments.is_active, true)));

    if (action === 'assign' && trainer_id) {
      const branchRow = await drizzleDb.select({ id: branches.id }).from(branches).limit(1);
      const branchId  = branchRow[0]?.id;
      await drizzleDb.insert(memberTrainerAssignments).values({
        member_id: id, trainer_id, branch_id: branchId,
        assigned_by: userId, is_active: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[trainer POST]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
