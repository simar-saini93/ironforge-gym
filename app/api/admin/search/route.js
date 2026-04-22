import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ── Constants ────────────────────────────────────────────────
const MIN_QUERY_LEN  = 2;
const MAX_QUERY_LEN  = 100;
const MAX_PER_GROUP  = 4;

const REPORT_TABS = [
  { label: 'Revenue Report',       tab: 'revenue',     },
  { label: 'Members Report',       tab: 'members',     },
  { label: 'Expiring Memberships', tab: 'expiring',    },
  { label: 'Attendance Report',    tab: 'attendance',  },
  { label: 'Trainer Attendance',   tab: 'trainer_att', },
  { label: 'Leads Report',         tab: 'leads',       },
];

// ── Supabase admin client (service role — bypasses RLS) ──────
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Verify session — only admins can search ──────────────────
async function getSessionRole(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await getAdminClient()
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role || null;
  } catch {
    return null;
  }
}

// ── Input sanitization ───────────────────────────────────────
function sanitize(q) {
  return q
    .trim()
    .replace(/[%_\\]/g, '\\$&') // escape SQL LIKE special chars
    .slice(0, MAX_QUERY_LEN);
}

// ── Main handler ─────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';

    // ── Validate query ───────────────────────────────────────
    if (!rawQuery || rawQuery.trim().length < MIN_QUERY_LEN) {
      return NextResponse.json(
        { error: `Query must be at least ${MIN_QUERY_LEN} characters` },
        { status: 400 }
      );
    }

    // ── Auth check ───────────────────────────────────────────
    const role = await getSessionRole(request);
    if (!role || role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const q = sanitize(rawQuery);
    const s = q.toLowerCase();
    const db = getAdminClient();

    // ── Run all queries in parallel ──────────────────────────
    const [
      { data: members,  error: membersError  },
      { data: trainers, error: trainersError },
      { data: leads,    error: leadsError    },
    ] = await Promise.all([

      // Members — fetch all active, filter by name/email/number client-side
      db.from('members')
        .select(`
          id,
          member_number,
          is_active,
          profile:profiles!members_profile_id_fkey (
            first_name, last_name, email
          ),
          subscription:member_subscriptions (
            status
          )
        `)
        .eq('is_active', true)
        .limit(200),

      // Trainers — fetch all active, filter by name/email client-side
      db.from('trainers')
        .select(`
          id,
          specialization,
          is_active,
          profile:profiles!trainers_profile_id_fkey (
            first_name, last_name, email
          )
        `)
        .eq('is_active', true)
        .limit(100),

      // Leads — search by name, phone, email (active only)
      db.from('leads')
        .select('id, first_name, last_name, phone, email, status, source')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
        .in('status', ['new', 'contacted', 'interested'])
        .order('created_at', { ascending: false })
        .limit(MAX_PER_GROUP),
    ]);

    // Log errors but don't fail the whole request
    if (membersError)  console.error('[search] members error:',  membersError.message);
    if (trainersError) console.error('[search] trainers error:', trainersError.message);
    if (leadsError)    console.error('[search] leads error:',    leadsError.message);

    // ── Filter members by name/email client-side ─────────────
    const filteredMembers = (members || [])
      .filter((m) => {
        const fname = (m.profile?.first_name || '').toLowerCase();
        const lname = (m.profile?.last_name  || '').toLowerCase();
        const name  = `${fname} ${lname}`.trim();
        const email = (m.profile?.email       || '').toLowerCase();
        const num   = (m.member_number        || '').toLowerCase();
        return name.includes(s) || fname.includes(s) || lname.includes(s) || email.includes(s) || num.includes(s);
      })
      .slice(0, MAX_PER_GROUP)
      .map((m) => ({
        id:            m.id,
        member_number: m.member_number,
        first_name:    m.profile?.first_name,
        last_name:     m.profile?.last_name,
        email:         m.profile?.email,
        sub_status:    m.subscription?.find((s) => s.status === 'active')?.status || m.subscription?.[0]?.status || null,
      }));

    // ── Filter trainers by name/email client-side ─────────────
    const filteredTrainers = (trainers || [])
      .filter((t) => {
        const fname = (t.profile?.first_name || '').toLowerCase();
        const lname = (t.profile?.last_name  || '').toLowerCase();
        const name  = `${fname} ${lname}`.trim();
        const email = (t.profile?.email       || '').toLowerCase();
        return name.includes(s) || fname.includes(s) || lname.includes(s) || email.includes(s);
      })
      .slice(0, MAX_PER_GROUP)
      .map((t) => ({
        id:             t.id,
        first_name:     t.profile?.first_name,
        last_name:      t.profile?.last_name,
        email:          t.profile?.email,
        specialization: t.specialization,
      }));

    // ── Static report matches ─────────────────────────────────
    const reports = REPORT_TABS
      .filter((r) => r.label.toLowerCase().includes(s))
      .map((r) => ({ label: r.label, tab: r.tab }));

    // ── Shape leads ───────────────────────────────────────────
    const shapedLeads = (leads || []).map((l) => ({
      id:         l.id,
      first_name: l.first_name,
      last_name:  l.last_name,
      phone:      l.phone,
      email:      l.email,
      status:     l.status,
      source:     l.source,
    }));

    const payload = {
      members:  filteredMembers,
      trainers: filteredTrainers,
      leads:    shapedLeads,
      reports,
      meta: {
        query: rawQuery,
        total: filteredMembers.length + filteredTrainers.length + shapedLeads.length + reports.length,
      },
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        // Short cache — search results should be fresh but not hammered
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      },
    });

  } catch (err) {
    console.error('[search] Unexpected error:', err?.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
