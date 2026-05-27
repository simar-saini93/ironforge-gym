import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import {
  members, profiles, memberSubscriptions,
  trainers, leads,
} from '@/db/schema';
import { eq, and, ilike, or, inArray } from 'drizzle-orm';
import { searchLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { searchSchema, validateQuery }      from '@/lib/utils/validate';

const MAX_PER_GROUP = 4;

const REPORT_TABS = [
  { label: 'Revenue Report',       tab: 'revenue'     },
  { label: 'Members Report',       tab: 'members'     },
  { label: 'Expiring Memberships', tab: 'expiring'    },
  { label: 'Attendance Report',    tab: 'attendance'  },
  { label: 'Trainer Attendance',   tab: 'trainer_att' },
  { label: 'Leads Report',         tab: 'leads'       },
];

function sanitize(q) {
  return q.trim().replace(/[%_\\]/g, '\\$&').slice(0, 100);
}

export async function GET(request) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit — 30 per minute per user ───────────────────
    try { await searchLimiter.check(30, userId); }
    catch { return rateLimitResponse(30); }

    // ── Validate query ────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const { success, data, error } = validateQuery(searchSchema, searchParams);
    if (!success) return error;

    const q   = sanitize(data.q);
    const pat = `%${q}%`;
    const s   = q.toLowerCase();

    // ── Parallel queries ──────────────────────────────────────
    const [memberRows, trainerRows, leadRows] = await Promise.all([
      // Members — filter by name, email, member_number
      drizzleDb
        .select({
          id:            members.id,
          member_number: members.member_number,
          is_active:     members.is_active,
          first_name:    profiles.first_name,
          last_name:     profiles.last_name,
          email:         profiles.email,
          sub_status:    memberSubscriptions.status,
        })
        .from(members)
        .leftJoin(profiles, eq(members.profile_id, profiles.id))
        .leftJoin(memberSubscriptions, and(
          eq(memberSubscriptions.member_id, members.id),
          eq(memberSubscriptions.status, 'active'),
        ))
        .where(and(
          eq(members.is_active, true),
          or(
            ilike(profiles.first_name,   pat),
            ilike(profiles.last_name,    pat),
            ilike(profiles.email,        pat),
            ilike(members.member_number, pat),
          ),
        ))
        .limit(MAX_PER_GROUP),

      // Trainers — filter by name, email
      drizzleDb
        .select({
          id:             trainers.id,
          specialization: trainers.specialization,
          first_name:     profiles.first_name,
          last_name:      profiles.last_name,
          email:          profiles.email,
        })
        .from(trainers)
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .where(and(
          eq(trainers.is_active, true),
          or(
            ilike(profiles.first_name, pat),
            ilike(profiles.last_name,  pat),
            ilike(profiles.email,      pat),
          ),
        ))
        .limit(MAX_PER_GROUP),

      // Leads — filter by name, phone, email
      drizzleDb
        .select({
          id:         leads.id,
          first_name: leads.first_name,
          last_name:  leads.last_name,
          phone:      leads.phone,
          email:      leads.email,
          status:     leads.status,
          source:     leads.source,
        })
        .from(leads)
        .where(and(
          inArray(leads.status, ['new', 'contacted', 'interested']),
          or(
            ilike(leads.first_name, pat),
            ilike(leads.last_name,  pat),
            ilike(leads.phone,      pat),
            ilike(leads.email,      pat),
          ),
        ))
        .limit(MAX_PER_GROUP),
    ]);

    // ── Shape results ─────────────────────────────────────────
    const filteredMembers = memberRows.map((m) => ({
      id:            m.id,
      member_number: m.member_number,
      first_name:    m.first_name,
      last_name:     m.last_name,
      email:         m.email,
      sub_status:    m.sub_status || null,
    }));

    const filteredTrainers = trainerRows.map((t) => ({
      id:             t.id,
      first_name:     t.first_name,
      last_name:      t.last_name,
      email:          t.email,
      specialization: t.specialization,
    }));

    const shapedLeads = leadRows.map((l) => ({
      id:         l.id,
      first_name: l.first_name,
      last_name:  l.last_name,
      phone:      l.phone,
      email:      l.email,
      status:     l.status,
      source:     l.source,
    }));

    // ── Report tab matches ────────────────────────────────────
    const reports = REPORT_TABS
      .filter((r) => r.label.toLowerCase().includes(s))
      .map((r) => ({ label: r.label, tab: r.tab }));

    return NextResponse.json({
      members:  filteredMembers,
      trainers: filteredTrainers,
      leads:    shapedLeads,
      reports,
      meta: {
        query: data.q,
        total: filteredMembers.length + filteredTrainers.length + shapedLeads.length + reports.length,
      },
    }, {
      headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' },
    });

  } catch (err) {
    console.error('[api/admin/search]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
