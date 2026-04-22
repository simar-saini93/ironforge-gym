'use client';

import { formatCurrency } from '@/utils/format';
import { useEffect, useState } from 'react';
import { Users, Banknote, AlertTriangle, Target, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AdminShell from '@/components/admin/layout/AdminShell';
import StatCard from '@/components/admin/dashboard/StatCard';
import RevenueChart from '@/components/admin/dashboard/RevenueChart';
import ExpiringList from '@/components/admin/dashboard/ExpiringList';
import ActivityFeed from '@/components/admin/dashboard/ActivityFeed';
import TrainerAttendanceWidget from '@/components/admin/dashboard/TrainerAttendanceWidget';

// ── Add Member button ────────────────────────────────────────
function AddMemberBtn() {
  return (
    <a
      href="/admin/members/new"
      className="hidden sm:inline-flex items-center gap-2 transition-all"
      style={{
        fontFamily:    "'Outfit', sans-serif",
        fontSize:      13,
        fontWeight:    600,
        background:    'var(--if-accent)',
        color:         '#000',
        border:        'none',
        borderRadius:  8,
        padding:       '0 17px',
        height:        38,
        cursor:        'pointer',
        letterSpacing: '.01em',
        whiteSpace:    'nowrap',
        textDecoration:'none',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <UserPlus size={15} />
      Add Member
    </a>
  );
}

// ── Skeleton loader ──────────────────────────────────────────
function Skeleton({ h = 120, radius = 12 }) {
  return (
    <div
      className="animate-pulse"
      style={{
        height:        h,
        borderRadius:  radius,
        background:    'var(--if-card)',
        border:        '1px solid var(--if-border)',
      }}
    />
  );
}

// ── Dashboard data fetching ──────────────────────────────────
async function fetchDashboardData(supabase) {
  const today = new Date().toISOString().split('T')[0];
  const in7   = new Date(Date.now() + 7  * 864e5).toISOString().split('T')[0];
  const in30  = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];

  const [
    { count: activeMembers },
    { data: expiring },
    { count: newLeads },
    { data: recentAccess },
    { data: trainers },
    { data: payments },
  ] = await Promise.all([
    // Active members count
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),

    // Expiring in 30 days
    supabase
      .from('member_subscriptions')
      .select(`
        id, end_date, status,
        plan:membership_plans(billing_cycle),
        member:members(id, profile:profiles(first_name, last_name))
      `)
      .eq('status', 'active')
      .gte('end_date', today)
      .lte('end_date', in30)
      .order('end_date', { ascending: true })
      .limit(8),

    // New leads — status never changed (still 'new')
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new'),

    // Recent access logs
    supabase
      .from('access_logs')
      .select(`
        id, method, status, accessed_at,
        member:members(profile:profiles(first_name, last_name))
      `)
      .order('accessed_at', { ascending: false })
      .limit(8),

    // Trainers with attendance
    supabase
      .from('trainers')
      .select(`
        id,
        profile:profiles(first_name, last_name),
        attendance:trainer_attendance(status, date)
      `)
      .eq('is_active', true)
      .limit(5),

    // Payments this month for revenue
    supabase
      .from('payments')
      .select('amount, payment_date')
      .gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  // ── Format expiring members ──
  const expiringFormatted = (expiring || []).map((s) => {
    const daysLeft = Math.ceil(
      (new Date(s.end_date) - new Date()) / 864e5
    );
    const name =
      `${s.member?.profile?.first_name || ''} ${s.member?.profile?.last_name || ''}`.trim() || 'Unknown';

    return {
      id:       s.id,
      name,
      plan:     s.plan?.billing_cycle?.replace('_', ' ') || 'Plan',
      date:     new Date(s.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      daysLeft,
    };
  });

  // ── Format activity feed ──
  const activityFormatted = (recentAccess || []).map((a) => {
    const name = `${a.member?.profile?.first_name || ''} ${a.member?.profile?.last_name || ''}`.trim() || 'Unknown';
    const time = new Date(a.accessed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const isGranted = a.status === 'granted';

    return {
      id:      a.id,
      type:    isGranted ? 'access_granted' : 'access_denied',
      message: isGranted
        ? `<strong style="color:var(--if-text)">${name}</strong> entered via ${a.method === 'qr' ? 'QR scan' : '4-digit code'}`
        : `<strong style="color:var(--if-text)">${name}</strong> access denied — ${a.method}`,
      time,
    };
  });

  // ── Format trainers ──
  const trainersFormatted = (trainers || []).map((t) => {
    const name = `${t.profile?.first_name || ''} ${t.profile?.last_name || ''}`.trim();
    const thisWeek = (t.attendance || []).filter((a) => {
      const d = new Date(a.date);
      const now = new Date();
      const weekAgo = new Date(now - 7 * 864e5);
      return d >= weekAgo && d <= now;
    });
    const present = thisWeek.filter((a) => a.status === 'present').length;
    const todayAtt = (t.attendance || []).find((a) => a.date === today);

    return {
      id:          t.id,
      name,
      todayStatus: todayAtt?.status || 'absent',
      present,
      total:       5,
    };
  });

  // ── Revenue total ──
  const revenue = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
  const revenueFormatted = formatCurrency(revenue);

  return {
    activeMembers: activeMembers || 0,
    expiring:      expiringFormatted,
    newLeads:      newLeads || 0,
    activity:      activityFormatted,
    trainers:      trainersFormatted,
    revenue:       revenueFormatted,
  };
}

// ── Main component ───────────────────────────────────────────
export default function DashboardView() {
  const supabase = createClient();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData(supabase)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <AdminShell
      topbarProps={{
        title:    'Dashboard',
        subtitle: `${today} · IronForge Main Branch`,
        actions:  <AddMemberBtn />,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Stat cards ── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap:                 14,
          }}
          className="grid-cols-2 sm:grid-cols-4"
        >
          {loading ? (
            [1,2,3,4].map((n) => <Skeleton key={n} h={130} />)
          ) : (
            <>
              <StatCard
                title="Active Members"
                value={String(data?.activeMembers ?? 0)}
                icon={Users}
                iconColor="var(--if-accent)"
                trend="up"
                trendText="+12 this month"
              />
              <StatCard
                title="Revenue (This Month)"
                value={data?.revenue ?? 'BZD 0'}
                icon={Banknote}
                iconColor="var(--if-green, #22d3a0)"
                trend="up"
                trendText="+8.4% vs last"
              />
              <StatCard
                title="Expiring Soon"
                value={String(data?.expiring?.length ?? 0)}
                icon={AlertTriangle}
                iconColor="var(--if-red, #f4566a)"
                trend="warn"
                trendText="Next 30 days"
              />
              <StatCard
                title="New Leads"
                value={String(data?.newLeads ?? 0)}
                icon={Target}
                iconColor="#38bdf8"
                trend="up"
                trendText="Awaiting contact"
              />
            </>
          )}
        </div>

        {/* ── Row 2: Members table area + right panels ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>

          {/* Revenue chart */}
          {loading
            ? <Skeleton h={220} />
            : <RevenueChart total={data?.revenue} currentMonth="Mar" />
          }

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loading ? (
              <><Skeleton h={100} /><Skeleton h={100} /></>
            ) : (
              <>
                <ExpiringList members={data?.expiring?.slice(0, 4) ?? []} />
                <ActivityFeed activities={data?.activity?.slice(0, 4) ?? []} />
              </>
            )}
          </div>
        </div>

        {/* ── Row 3: Trainer attendance ── */}
        {loading
          ? <Skeleton h={200} />
          : <TrainerAttendanceWidget trainers={data?.trainers ?? []} />
        }

      </div>
    </AdminShell>
  );
}
