import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import {
  profiles, trainers, memberTrainerAssignments,
  members, trainerAttendance, branches,
} from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { trainerLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try { await trainerLimiter.check(45, userId); }
    catch { return rateLimitResponse(45); }

    const today = new Date().toISOString().split('T')[0];

    // Profile
    const profileRows = await drizzleDb
      .select({ first_name: profiles.first_name, last_name: profiles.last_name, branch_id: profiles.branch_id })
      .from(profiles).where(eq(profiles.id, userId)).limit(1);
    const profile = profileRows[0] || null;

    // Trainer record
    const trainerRows = await drizzleDb
      .select({ id: trainers.id, specialization: trainers.specialization })
      .from(trainers).where(eq(trainers.profile_id, userId)).limit(1);
    const trainer = trainerRows[0] || null;
    if (!trainer) return NextResponse.json({ profile, trainer: null, assignments: [], todayAtt: null, attRate: 0, presentCount: 0 }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });

    // Assigned members
    const assignRows = await drizzleDb
      .select({
        id:            memberTrainerAssignments.id,
        member_id:     members.id,
        member_number: members.member_number,
        first_name:    profiles.first_name,
        last_name:     profiles.last_name,
      })
      .from(memberTrainerAssignments)
      .leftJoin(members, eq(memberTrainerAssignments.member_id, members.id))
      .leftJoin(profiles, eq(members.profile_id, profiles.id))
      .where(and(eq(memberTrainerAssignments.trainer_id, trainer.id), eq(memberTrainerAssignments.is_active, true)));

    const assignments = assignRows.map((a) => ({
      id:     a.id,
      member: { id: a.member_id, member_number: a.member_number, profile: { first_name: a.first_name, last_name: a.last_name } },
    }));

    // Today's attendance
    const todayRows = await drizzleDb
      .select({ id: trainerAttendance.id, status: trainerAttendance.status })
      .from(trainerAttendance)
      .where(and(eq(trainerAttendance.trainer_id, trainer.id), eq(trainerAttendance.date, today)))
      .limit(1);
    const todayAtt = todayRows[0] || null;

    // Attendance history (last 30 entries)
    const historyRows = await drizzleDb
      .select({ status: trainerAttendance.status })
      .from(trainerAttendance)
      .where(eq(trainerAttendance.trainer_id, trainer.id))
      .orderBy(desc(trainerAttendance.date))
      .limit(30);

    const presentCount = historyRows.filter((a) => a.status === 'present').length;
    const attRate      = historyRows.length > 0 ? Math.round((presentCount / historyRows.length) * 100) : 0;

    return NextResponse.json({ profile, trainer, assignments, todayAtt, attRate, presentCount }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('[api/trainer/dashboard]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — mark attendance ────────────────────────────────────
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try { await trainerLimiter.check(20, userId); }
    catch { return rateLimitResponse(20); }

    const { status } = await request.json();
    if (!['present', 'absent', 'leave'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    const trainerRows = await drizzleDb
      .select({ id: trainers.id })
      .from(trainers).where(eq(trainers.profile_id, userId)).limit(1);
    const trainer = trainerRows[0];
    if (!trainer) return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });

    const profileRows = await drizzleDb
      .select({ branch_id: profiles.branch_id })
      .from(profiles).where(eq(profiles.id, userId)).limit(1);
    const branchId = profileRows[0]?.branch_id;

    // Check existing
    const existing = await drizzleDb
      .select({ id: trainerAttendance.id })
      .from(trainerAttendance)
      .where(and(eq(trainerAttendance.trainer_id, trainer.id), eq(trainerAttendance.date, today)))
      .limit(1);

    if (existing[0]) {
      await drizzleDb.update(trainerAttendance)
        .set({ status, marked_by: userId })
        .where(eq(trainerAttendance.id, existing[0].id));
    } else {
      await drizzleDb.insert(trainerAttendance).values({
        trainer_id: trainer.id, branch_id: branchId,
        date: today, status, marked_by: userId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/trainer/dashboard POST]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
