import { NextResponse }  from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import {
  trainers, profiles, memberTrainerAssignments,
  members, trainerAttendance, branches,
} from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

// ── GET — trainer detail ──────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    const { id } = await params;

    const [trainerRows, attendanceRows, assignmentRows] = await Promise.all([
      drizzleDb
        .select({
          id:             trainers.id,
          is_active:      trainers.is_active,
          specialization: trainers.specialization,
          bio:            trainers.bio,
          created_at:     trainers.created_at,
          first_name:     profiles.first_name,
          last_name:      profiles.last_name,
          email:          profiles.email,
          phone:          profiles.phone,
        })
        .from(trainers)
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .where(eq(trainers.id, id))
        .limit(1),

      drizzleDb
        .select({ id: trainerAttendance.id, date: trainerAttendance.date, status: trainerAttendance.status, notes: trainerAttendance.notes })
        .from(trainerAttendance)
        .where(eq(trainerAttendance.trainer_id, id))
        .orderBy(desc(trainerAttendance.date))
        .limit(20),

      drizzleDb
        .select({
          id:            memberTrainerAssignments.id,
          is_active:     memberTrainerAssignments.is_active,
          assigned_at:   memberTrainerAssignments.assigned_at,
          member_id:     members.id,
          member_number: members.member_number,
          first_name:    profiles.first_name,
          last_name:     profiles.last_name,
        })
        .from(memberTrainerAssignments)
        .leftJoin(members, eq(memberTrainerAssignments.member_id, members.id))
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .where(eq(memberTrainerAssignments.trainer_id, id)),
    ]);

    const trainer = trainerRows[0] ?? null;
    if (!trainer) return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });

    return NextResponse.json({
      trainer: {
        ...trainer,
        profile: { first_name: trainer.first_name, last_name: trainer.last_name, email: trainer.email, phone: trainer.phone },
        assignments: assignmentRows.map((a) => ({
          id: a.id, is_active: a.is_active, assigned_at: a.assigned_at,
          member: { id: a.member_id, member_number: a.member_number, profile: { first_name: a.first_name, last_name: a.last_name } },
        })),
      },
      attendance: attendanceRows,
    });
  } catch (err) {
    console.error('[api/admin/trainers/[id] GET]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST — mark attendance ────────────────────────────────────
const attendanceSchema = z.object({ status: z.enum(['present', 'absent', 'leave']) });

export async function POST(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(30, userId); }
    catch { return rateLimitResponse(30); }

    const { id }   = await params;
    const body     = await request.json();
    const parsed   = attendanceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const branchRow = await drizzleDb.select({ id: branches.id }).from(branches).limit(1);
    const branchId  = branchRow[0]?.id;
    const today     = new Date().toISOString().split('T')[0];

    await drizzleDb
      .insert(trainerAttendance)
      .values({ trainer_id: id, branch_id: branchId, date: today, status: parsed.data.status, marked_by: userId })
      .onConflictDoUpdate({
        target: [trainerAttendance.trainer_id, trainerAttendance.date],
        set: { status: parsed.data.status, marked_by: userId },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/trainers/[id] POST]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT — update trainer ──────────────────────────────────────
const updateSchema = z.object({
  is_active:      z.boolean().optional(),
  first_name:     z.string().min(1).max(100).trim().optional(),
  last_name:      z.string().max(100).trim().optional().nullable(),
  phone:          z.string().max(20).trim().optional().nullable(),
  specialization: z.string().max(200).trim().optional().nullable(),
  bio:            z.string().max(2000).trim().optional().nullable(),
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
    const parsed   = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { first_name, last_name, phone, specialization, bio, is_active } = parsed.data;

    // Get profile_id from trainer
    const trainerRow = await drizzleDb.select({ profile_id: trainers.profile_id }).from(trainers).where(eq(trainers.id, id)).limit(1);
    const profileId  = trainerRow[0]?.profile_id;

    const trainerUpdate = {
      ...(specialization !== undefined && { specialization }),
      ...(bio            !== undefined && { bio }),
      ...(is_active      !== undefined && { is_active }),
      updated_at: new Date(),
    };

    await Promise.all([
      profileId && drizzleDb.update(profiles).set({ ...(first_name && { first_name }), ...(last_name !== undefined && { last_name }), ...(phone !== undefined && { phone }) }).where(eq(profiles.id, profileId)),
      drizzleDb.update(trainers).set(trainerUpdate).where(eq(trainers.id, id)),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/trainers/[id] PUT]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE — remove trainer ───────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get profile_id before deleting
    const trainerRows = await drizzleDb
      .select({ id: trainers.id, profile_id: trainers.profile_id })
      .from(trainers).where(eq(trainers.id, id)).limit(1);
    const trainer = trainerRows[0];
    if (!trainer) return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });

    // ── Get email BEFORE deleting anything ──────────────────────
    const profileRows = await drizzleDb
      .select({ email: profiles.email })
      .from(profiles).where(eq(profiles.id, trainer.profile_id)).limit(1);
    const trainerEmail = profileRows[0]?.email;

    // ── Clerk cleanup FIRST (needs email) ─────────────────────
    const client = await clerkClient();

    // Always revoke pending invitations by email
    if (trainerEmail) {
      const invitations = await client.invitations.getInvitationList({ status: 'pending' }).catch(() => ({ data: [] }));
      const pending = invitations.data?.find((i) => i.emailAddress === trainerEmail);
      if (pending) {
        await client.invitations.revokeInvitation(pending.id)
          .catch((e) => console.error('[trainer delete] revoke error:', e?.message));
      }
    }

    // Delete Clerk user only if profile_id is a real user ID (not invite ID)
    if (trainer.profile_id && !trainer.profile_id.startsWith('inv_')) {
      await client.users.deleteUser(trainer.profile_id)
        .catch((e) => console.error('[trainer delete] deleteUser error:', e?.message));
    }

    // ── Delete DB records ─────────────────────────────────────
    await drizzleDb.delete(memberTrainerAssignments).where(eq(memberTrainerAssignments.trainer_id, id));
    await drizzleDb.delete(trainerAttendance).where(eq(trainerAttendance.trainer_id, id));
    await drizzleDb.delete(trainers).where(eq(trainers.id, id));
    if (trainer.profile_id) {
      await drizzleDb.delete(profiles).where(eq(profiles.id, trainer.profile_id)).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/trainers/[id] DELETE]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
