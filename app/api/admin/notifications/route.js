import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ── Admin client (service role) ──────────────────────────────
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Auth check ───────────────────────────────────────────────
async function getSessionRole() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await getAdminClient()
      .from('profiles').select('role').eq('id', user.id).single();
    return profile?.role || null;
  } catch {
    return null;
  }
}

// ── GET /api/admin/notifications ─────────────────────────────
export async function GET() {
  try {
    const role = await getSessionRole();
    if (!role || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db    = getAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const in7   = new Date(Date.now() + 7  * 864e5).toISOString().split('T')[0];
    const in3   = new Date(Date.now() + 3  * 864e5).toISOString().split('T')[0];
    const ago3  = new Date(Date.now() - 3  * 24 * 3600 * 1000).toISOString();
    const ago1  = new Date(Date.now() - 1  * 24 * 3600 * 1000).toISOString();

    const [
      { data: newLeads       },
      { data: staleLeads     },
      { data: expiringIn3    },
      { data: expiringIn7    },
      { data: expiredToday   },
      { data: absentTrainers },
    ] = await Promise.all([

      // New leads submitted in last 24h
      db.from('leads')
        .select('id, first_name, last_name, created_at, source')
        .eq('status', 'new')
        .gte('created_at', ago1)
        .order('created_at', { ascending: false })
        .limit(10),

      // Leads not contacted in 3+ days (still status=new)
      db.from('leads')
        .select('id, first_name, last_name, created_at')
        .eq('status', 'new')
        .lte('created_at', ago3)
        .order('created_at', { ascending: true })
        .limit(5),

      // Memberships expiring in exactly 1-3 days
      db.from('member_subscriptions')
        .select('id, end_date, member:members(id, member_number, profile:profiles(first_name, last_name))')
        .eq('status', 'active')
        .gte('end_date', today)
        .lte('end_date', in3)
        .order('end_date', { ascending: true })
        .limit(10),

      // Memberships expiring in 4-7 days
      db.from('member_subscriptions')
        .select('id, end_date, member:members(id, member_number, profile:profiles(first_name, last_name))')
        .eq('status', 'active')
        .gt('end_date', in3)
        .lte('end_date', in7)
        .order('end_date', { ascending: true })
        .limit(10),

      // Memberships that expired today
      db.from('member_subscriptions')
        .select('id, end_date, member:members(id, member_number, profile:profiles(first_name, last_name))')
        .eq('status', 'active')
        .lt('end_date', today)
        .gte('end_date', new Date(Date.now() - 2 * 864e5).toISOString().split('T')[0])
        .limit(10),

      // Trainers who haven't marked attendance today
      db.from('trainers')
        .select(`
          id,
          profile:profiles(first_name, last_name),
          attendance:trainer_attendance(date, status)
        `)
        .eq('is_active', true)
        .limit(20),
    ]);

    // Filter trainers who haven't marked today
    const unmarkedTrainers = (absentTrainers || []).filter((t) => {
      const todayAtt = (t.attendance || []).find((a) => a.date === today);
      return !todayAtt;
    });

    // ── Build notifications array ────────────────────────────
    const notifications = [];

    // New leads (highest priority)
    (newLeads || []).forEach((l) => {
      notifications.push({
        id:       `lead-new-${l.id}`,
        type:     'new_lead',
        priority: 'high',
        title:    'New lead from website',
        body:     `${l.first_name} ${l.last_name || ''} submitted the join form`.trim(),
        link:     `/admin/crm/${l.id}`,
        time:     l.created_at,
        read:     false,
      });
    });

    // Expired today (urgent)
    (expiredToday || []).forEach((s) => {
      const name = `${s.member?.profile?.first_name || ''} ${s.member?.profile?.last_name || ''}`.trim();
      notifications.push({
        id:       `sub-expired-${s.id}`,
        type:     'expired',
        priority: 'urgent',
        title:    'Membership expired',
        body:     `${name} · ${s.member?.member_number}`,
        link:     `/admin/members/${s.member?.id}`,
        time:     new Date(`${s.end_date}T00:00:00`).toISOString(),
        read:     false,
      });
    });

    // Expiring in 3 days (urgent)
    (expiringIn3 || []).forEach((s) => {
      const name = `${s.member?.profile?.first_name || ''} ${s.member?.profile?.last_name || ''}`.trim();
      const days = Math.ceil((new Date(s.end_date) - new Date()) / 864e5);
      notifications.push({
        id:       `sub-expiring3-${s.id}`,
        type:     'expiring_soon',
        priority: 'urgent',
        title:    `Membership expiring in ${days} day${days !== 1 ? 's' : ''}`,
        body:     `${name} · expires ${new Date(s.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        link:     `/admin/members/${s.member?.id}`,
        time:     new Date().toISOString(),
        read:     false,
      });
    });

    // Expiring in 4-7 days (warning)
    (expiringIn7 || []).forEach((s) => {
      const name = `${s.member?.profile?.first_name || ''} ${s.member?.profile?.last_name || ''}`.trim();
      const days = Math.ceil((new Date(s.end_date) - new Date()) / 864e5);
      notifications.push({
        id:       `sub-expiring7-${s.id}`,
        type:     'expiring_soon',
        priority: 'warning',
        title:    `Membership expiring in ${days} days`,
        body:     `${name} · expires ${new Date(s.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        link:     `/admin/members/${s.member?.id}`,
        time:     new Date().toISOString(),
        read:     false,
      });
    });

    // Stale leads (warning)
    (staleLeads || []).forEach((l) => {
      const days = Math.floor((Date.now() - new Date(l.created_at)) / 864e5);
      notifications.push({
        id:       `lead-stale-${l.id}`,
        type:     'stale_lead',
        priority: 'warning',
        title:    'Lead not contacted',
        body:     `${l.first_name} ${l.last_name || ''} · ${days} days with no followup`.trim(),
        link:     `/admin/crm/${l.id}`,
        time:     l.created_at,
        read:     false,
      });
    });

    // Unmarked trainer attendance (info)
    unmarkedTrainers.slice(0, 5).forEach((t) => {
      const name = `${t.profile?.first_name || ''} ${t.profile?.last_name || ''}`.trim();
      notifications.push({
        id:       `trainer-absent-${t.id}`,
        type:     'trainer_unmarked',
        priority: 'info',
        title:    'Trainer attendance not marked',
        body:     `${name} hasn't marked today's attendance`,
        link:     `/admin/trainers/${t.id}`,
        time:     new Date().toISOString(),
        read:     false,
      });
    });

    // Sort by priority then time
    const PRIORITY_ORDER = { urgent: 0, high: 1, warning: 2, info: 3 };
    notifications.sort((a, b) => {
      const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pd !== 0) return pd;
      return new Date(b.time) - new Date(a.time);
    });

    return NextResponse.json({
      notifications,
      unread: notifications.length,
      meta: {
        new_leads:        (newLeads     || []).length,
        stale_leads:      (staleLeads   || []).length,
        expiring_urgent:  (expiringIn3  || []).length + (expiredToday || []).length,
        expiring_warning: (expiringIn7  || []).length,
        unmarked_trainers: unmarkedTrainers.length,
      },
    }, {
      status: 200,
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
    });

  } catch (err) {
    console.error('[notifications] Error:', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
