'use client';

import { formatCurrency } from '@/lib/utils/format';
import { useEffect, useState } from 'react';
import { Users, Banknote, AlertTriangle, Target, UserPlus } from 'lucide-react';
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

// ── Main component ───────────────────────────────────────────
export default function DashboardView() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load dashboard');
        return r.json();
      })
      .then((json) => {
        setData({
          ...json,
          revenue: formatCurrency(json.revenue ?? 0),
        });
      })
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
