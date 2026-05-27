import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import { members, memberTrainerAssignments, trainers, profiles } from '@/db/schema';
import { eq, and }      from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const memberRows = await drizzleDb.select({ id: members.id }).from(members).where(eq(members.profile_id, userId)).limit(1);
    const member = memberRows[0];
    if (!member) return NextResponse.json({ trainer: null });

    const rows = await drizzleDb
      .select({
        specialization: trainers.specialization,
        bio:            trainers.bio,
        first_name:     profiles.first_name,
        last_name:      profiles.last_name,
        email:          profiles.email,
        phone:          profiles.phone,
      })
      .from(memberTrainerAssignments)
      .leftJoin(trainers, eq(memberTrainerAssignments.trainer_id, trainers.id))
      .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
      .where(and(eq(memberTrainerAssignments.member_id, member.id), eq(memberTrainerAssignments.is_active, true)))
      .limit(1);

    const t = rows[0];
    return NextResponse.json({
      trainer: t ? {
        specialization: t.specialization,
        bio:            t.bio,
        profile: { first_name: t.first_name, last_name: t.last_name, email: t.email, phone: t.phone },
      } : null,
    });
  } catch (err) {
    console.error('[api/member/trainer]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
