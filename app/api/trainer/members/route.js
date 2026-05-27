import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import {
  trainers, memberTrainerAssignments, members,
  profiles, memberSubscriptions, membershipPlans,
} from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { trainerLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try { await trainerLimiter.check(45, userId); }
    catch { return rateLimitResponse(45); }

    const trainerRows = await drizzleDb
      .select({ id: trainers.id })
      .from(trainers).where(eq(trainers.profile_id, userId)).limit(1);
    const trainer = trainerRows[0];
    if (!trainer) return NextResponse.json({ members: [] });

    // Get assigned member IDs
    const assignRows = await drizzleDb
      .select({ member_id: memberTrainerAssignments.member_id, assigned_at: memberTrainerAssignments.assigned_at })
      .from(memberTrainerAssignments)
      .where(and(eq(memberTrainerAssignments.trainer_id, trainer.id), eq(memberTrainerAssignments.is_active, true)));

    if (assignRows.length === 0) return NextResponse.json({ members: [] });

    const memberIds = assignRows.map((a) => a.member_id);

    // Fetch each member with profile + active subscription
    const result = await Promise.all(memberIds.map(async (memberId) => {
      const [memberRows, subRows] = await Promise.all([
        drizzleDb
          .select({
            id:              members.id,
            member_number:   members.member_number,
            is_active:       members.is_active,
            created_at:      members.created_at,
            first_name:      profiles.first_name,
            last_name:       profiles.last_name,
            email:           profiles.email,
            phone:           profiles.phone,
          })
          .from(members)
          .leftJoin(profiles, eq(members.profile_id, profiles.id))
          .where(eq(members.id, memberId))
          .limit(1),

        drizzleDb
          .select({
            status:        memberSubscriptions.status,
            end_date:      memberSubscriptions.end_date,
            billing_cycle: membershipPlans.billing_cycle,
          })
          .from(memberSubscriptions)
          .leftJoin(membershipPlans, eq(memberSubscriptions.plan_id, membershipPlans.id))
          .where(eq(memberSubscriptions.member_id, memberId))
          .orderBy(desc(memberSubscriptions.end_date))
          .limit(1),
      ]);

      const m   = memberRows[0];
      const sub = subRows[0];
      if (!m) return null;

      return {
        id:            m.id,
        member_number: m.member_number,
        is_active:     m.is_active,
        created_at:    m.created_at,
        profile:       { first_name: m.first_name, last_name: m.last_name, email: m.email, phone: m.phone },
        subscription:  sub ? [{ status: sub.status, end_date: sub.end_date, plan: { billing_cycle: sub.billing_cycle } }] : [],
      };
    }));

    return NextResponse.json({ members: result.filter(Boolean) }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });
  } catch (err) {
    console.error('[api/trainer/members]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
