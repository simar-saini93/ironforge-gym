import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import { leads, leadFollowups, members, profiles } from '@/db/schema';
import { eq, desc }      from 'drizzle-orm';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { z } from 'zod';

// ── GET — lead + followups ────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    const { id } = await params;

    const [leadRows, followupRows] = await Promise.all([
      drizzleDb.select().from(leads).where(eq(leads.id, id)).limit(1),
      drizzleDb.select().from(leadFollowups).where(eq(leadFollowups.lead_id, id)).orderBy(desc(leadFollowups.followed_at)),
    ]);

    const lead = leadRows[0] ?? null;
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    // Fetch member name if converted
    let memberName = null;
    if (lead.converted_member_id) {
      const memberRows = await drizzleDb
        .select({ first_name: profiles.first_name, last_name: profiles.last_name })
        .from(members)
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .where(eq(members.id, lead.converted_member_id))
        .limit(1);
      if (memberRows[0]) {
        memberName = `${memberRows[0].first_name || ''} ${memberRows[0].last_name || ''}`.trim();
      }
    }

    return NextResponse.json({ lead, followups: followupRows, memberName });
  } catch (err) {
    console.error('[api/admin/leads/[id] GET]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH — update status / add followup / delete ─────────────
const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('update_status'), status: z.string() }),
  z.object({ action: z.literal('add_followup'),  method: z.string(), notes: z.string().min(1) }),
  z.object({ action: z.literal('delete') }),
]);

export async function PATCH(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await adminLimiter.check(30, userId); }
    catch { return rateLimitResponse(30); }

    const { id }   = await params;
    const body     = await request.json();
    const parsed   = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const data = parsed.data;

    if (data.action === 'update_status') {
      await drizzleDb.update(leads).set({ status: data.status, updated_at: new Date() }).where(eq(leads.id, id));
      return NextResponse.json({ success: true });
    }

    if (data.action === 'add_followup') {
      await drizzleDb.insert(leadFollowups).values({
        lead_id:     id,
        method:      data.method,
        notes:       data.notes,
        followed_by: userId,
        followed_at: new Date(),
      });
      return NextResponse.json({ success: true });
    }

    if (data.action === 'delete') {
      await drizzleDb.delete(leadFollowups).where(eq(leadFollowups.lead_id, id));
      await drizzleDb.delete(leads).where(eq(leads.id, id));
      return NextResponse.json({ success: true });
    }

  } catch (err) {
    console.error('[api/admin/leads/[id] PATCH]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
