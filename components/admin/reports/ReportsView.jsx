'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Users, AlertTriangle, DoorOpen,
  Dumbbell, UserPlus, TrendingUp, Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency, fullName, daysLeft, planLabel } from '@/utils/format';
import Badge from '@/components/ui/Badge';

// ── Helpers ──────────────────────────────────────────────────
function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}
function last12Months() {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

// ── Shared styles ────────────────────────────────────────────
const cardStyle = {
  background: 'var(--if-card)', border: '1px solid var(--if-border)',
  borderRadius: 12, padding: '18px 20px',
};

const labelStyle = {
  fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700,
  letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)',
  marginBottom: 4,
};

function SummaryCard({ icon: Icon, label, value, color = 'var(--if-accent)', bg = 'var(--if-accentbg2)' }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} style={{ color }} />
        </div>
        <p style={labelStyle}>{label}</p>
      </div>
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--if-text)', letterSpacing: '-.02em', lineHeight: 1 }}>{value}</p>
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────
function BarChart({ data, color = 'var(--if-accent)', valuePrefix = '', valueSuffix = '' }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, padding: '0 4px' }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, color: 'var(--if-muted)', textAlign: 'center' }}>
              {d.value > 0 ? `${valuePrefix}${d.value}${valueSuffix}` : ''}
            </span>
            <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${Math.max(pct, d.value > 0 ? 2 : 0)}%`, opacity: d.value > 0 ? 1 : 0.15, transition: 'height .3s ease', minHeight: d.value > 0 ? 4 : 0 }} />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, color: 'var(--if-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────
function Section({ title, color = 'var(--if-accent)', children, action }) {
  return (
    <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--if-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--if-text)' }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────
function Skeleton({ h = 120 }) {
  return <div style={{ height: h, borderRadius: 12, background: 'var(--if-card)', border: '1px solid var(--if-border)', animation: 'pulse 1.5s infinite' }} />;
}

// ════════════════════════════════════════════════════════════
// TAB 1 — Revenue
// ════════════════════════════════════════════════════════════
function RevenueReport() {
  const supabase = createClient();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const months = last12Months();
      const start  = `${months[0]}-01`;

      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_method')
        .gte('payment_date', start)
        .order('payment_date', { ascending: true });

      // Group by month
      const byMonth = {};
      months.forEach((m) => (byMonth[m] = 0));
      (payments || []).forEach((p) => {
        const k = monthKey(p.payment_date);
        if (byMonth[k] !== undefined) byMonth[k] += Number(p.amount);
      });

      // Payment method breakdown
      const methods = {};
      (payments || []).forEach((p) => {
        const m = p.payment_method || 'other';
        methods[m] = (methods[m] || 0) + Number(p.amount);
      });

      const total    = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
      const thisMonth = byMonth[monthKey(new Date().toISOString())] || 0;

      setData({
        chartData: months.map((m) => ({ label: monthLabel(m), value: Math.round(byMonth[m]) })),
        methods,
        total,
        thisMonth,
        count: payments?.length || 0,
      });
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><Skeleton h={80} /><Skeleton h={200} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <SummaryCard icon={DollarSign} label="Total Revenue (12m)"  value={formatCurrency(data.total)}     color="#22c55e"  bg="rgba(34,197,94,0.09)"  />
        <SummaryCard icon={TrendingUp} label="This Month"           value={formatCurrency(data.thisMonth)}  color="var(--if-accent)" bg="var(--if-accentbg2)" />
        <SummaryCard icon={DollarSign} label="Total Transactions"   value={data.count}                      color="#38bdf8"  bg="rgba(56,189,248,0.09)" />
      </div>

      <Section title="Monthly Revenue (Last 12 Months)" color="#22c55e">
        <BarChart data={data.chartData} color="#22c55e" valuePrefix="₹" />
      </Section>

      <Section title="Revenue by Payment Method" color="var(--if-accent)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(data.methods).sort((a, b) => b[1] - a[1]).map(([method, amount]) => {
            const pct = data.total > 0 ? Math.round((amount / data.total) * 100) : 0;
            return (
              <div key={method}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', textTransform: 'capitalize' }}>{method.replace('_', ' ')}</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--if-text)' }}>{formatCurrency(amount)} <span style={{ color: 'var(--if-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                </div>
                <div style={{ height: 6, background: 'var(--if-bg3)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--if-accent)', borderRadius: 10 }} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 2 — Members
// ════════════════════════════════════════════════════════════
function MembersReport() {
  const supabase = createClient();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const months = last12Months();
      const start  = `${months[0]}-01`;

      const [{ data: members }, { count: active }, { count: expired }] = await Promise.all([
        supabase.from('members').select('id, created_at, is_active').gte('created_at', start),
        supabase.from('member_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('member_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
      ]);

      const byMonth = {};
      months.forEach((m) => (byMonth[m] = 0));
      (members || []).forEach((m) => {
        const k = monthKey(m.created_at);
        if (byMonth[k] !== undefined) byMonth[k]++;
      });

      const { count: total } = await supabase.from('members').select('*', { count: 'exact', head: true });

      setData({
        chartData: months.map((m) => ({ label: monthLabel(m), value: byMonth[m] })),
        total: total || 0,
        active: active || 0,
        expired: expired || 0,
        newThisMonth: byMonth[monthKey(new Date().toISOString())] || 0,
      });
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><Skeleton h={80} /><Skeleton h={200} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <SummaryCard icon={Users}    label="Total Members"    value={data.total}          color="var(--if-accent)" bg="var(--if-accentbg2)" />
        <SummaryCard icon={UserPlus} label="New This Month"   value={data.newThisMonth}   color="#38bdf8"  bg="rgba(56,189,248,0.09)" />
        <SummaryCard icon={Users}    label="Active Subs"      value={data.active}         color="#22c55e"  bg="rgba(34,197,94,0.09)"  />
        <SummaryCard icon={Users}    label="Expired Subs"     value={data.expired}        color="#ef4444"  bg="rgba(239,68,68,0.09)"  />
      </div>
      <Section title="New Members per Month (Last 12 Months)" color="#38bdf8">
        <BarChart data={data.chartData} color="#38bdf8" />
      </Section>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 3 — Expiring
// ════════════════════════════════════════════════════════════
function ExpiringReport() {
  const supabase = createClient();
  const [subs,    setSubs]    = useState([]);
  const [filter,  setFilter]  = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const end   = new Date();
      end.setDate(end.getDate() + filter);

      const { data } = await supabase
        .from('member_subscriptions')
        .select(`
          id, status, end_date,
          plan:membership_plans(billing_cycle, price),
          member:members(id, member_number, profile:profiles(first_name, last_name, email, phone))
        `)
        .eq('status', 'active')
        .gte('end_date', today)
        .lte('end_date', end.toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      setSubs(data || []);
      setLoading(false);
    }
    fetch();
  }, [filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[7, 14, 30].map((d) => (
          <button key={d} onClick={() => setFilter(d)}
            style={{ height: 34, padding: '0 16px', borderRadius: 8, border: `1px solid ${filter === d ? 'var(--if-accent)' : 'var(--if-border2)'}`, background: filter === d ? 'var(--if-accentbg2)' : 'var(--if-card)', fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: filter === d ? 'var(--if-accent)' : 'var(--if-text2)', cursor: 'pointer', transition: 'all .15s' }}
          >
            Next {d} days
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 14px', background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 8 }}>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--if-text)' }}>{subs.length} expiring</span>
        </div>
      </div>

      <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--if-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Loading...</div>
        ) : subs.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--if-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
            No memberships expiring in the next {filter} days.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--if-bg3)', borderBottom: '1px solid var(--if-border)' }}>
                  {['Member', 'Plan', 'Expires', 'Days Left', 'Contact'].map((h) => (
                    <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)', padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.map((sub, i) => {
                  const name = fullName(sub.member?.profile);
                  const days = daysLeft(sub.end_date);
                  const urgent = days !== null && days <= 7;
                  return (
                    <tr key={sub.id} style={{ borderBottom: i < subs.length - 1 ? '1px solid var(--if-border)' : 'none' }}>
                      <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>{name}</p>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--if-muted)' }}>{sub.member?.member_number}</p>
                      </td>
                      <td style={{ padding: '11px 16px' }}><Badge variant="yellow" size="sm">{planLabel(sub.plan?.billing_cycle)}</Badge></td>
                      <td style={{ padding: '11px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: urgent ? '#ef4444' : 'var(--if-text2)', whiteSpace: 'nowrap', fontWeight: urgent ? 600 : 400 }}>{formatDate(sub.end_date)}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: urgent ? '#ef4444' : days <= 14 ? '#f97316' : 'var(--if-text)' }}>
                          {days}d
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)' }}>
                        {sub.member?.profile?.phone || sub.member?.profile?.email || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 4 — Attendance
// ════════════════════════════════════════════════════════════
function AttendanceReport() {
  const supabase = createClient();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const months = last12Months();
      const start  = `${months[0]}-01`;

      const [{ data: logs }, { count: today }] = await Promise.all([
        supabase.from('access_logs').select('accessed_at, status').gte('accessed_at', start).eq('status', 'granted'),
        supabase.from('access_logs').select('*', { count: 'exact', head: true })
          .eq('status', 'granted')
          .gte('accessed_at', new Date().toISOString().split('T')[0]),
      ]);

      const byMonth = {};
      months.forEach((m) => (byMonth[m] = 0));
      (logs || []).forEach((l) => {
        const k = monthKey(l.accessed_at);
        if (byMonth[k] !== undefined) byMonth[k]++;
      });

      const thisMonthKey = monthKey(new Date().toISOString());
      const thisMonth    = byMonth[thisMonthKey] || 0;
      const total        = (logs || []).length;

      setData({
        chartData: months.map((m) => ({ label: monthLabel(m), value: byMonth[m] })),
        total, thisMonth, today: today || 0,
      });
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><Skeleton h={80} /><Skeleton h={200} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <SummaryCard icon={DoorOpen} label="Today's Check-ins"    value={data.today}      color="var(--if-accent)" bg="var(--if-accentbg2)" />
        <SummaryCard icon={DoorOpen} label="This Month"           value={data.thisMonth}  color="#38bdf8"  bg="rgba(56,189,248,0.09)" />
        <SummaryCard icon={DoorOpen} label="Total (12m)"          value={data.total}      color="#22c55e"  bg="rgba(34,197,94,0.09)"  />
      </div>
      <Section title="Monthly Check-ins (Last 12 Months)" color="#38bdf8">
        <BarChart data={data.chartData} color="#38bdf8" />
      </Section>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 5 — Trainer Attendance
// ════════════════════════════════════════════════════════════
function TrainerAttendanceReport() {
  const supabase = createClient();
  const [trainers, setTrainers] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function fetch() {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];

      const { data: trainerList } = await supabase
        .from('trainers')
        .select('id, specialization, profile:profiles(first_name, last_name)')
        .eq('is_active', true);

      if (!trainerList?.length) { setLoading(false); return; }

      const results = await Promise.all(trainerList.map(async (t) => {
        const { data: att } = await supabase
          .from('trainer_attendance')
          .select('status, date')
          .eq('trainer_id', t.id)
          .gte('date', startOfMonth);

        const present = (att || []).filter((a) => a.status === 'present').length;
        const absent  = (att || []).filter((a) => a.status === 'absent').length;
        const leave   = (att || []).filter((a) => a.status === 'leave').length;
        const total   = present + absent + leave;
        const rate    = total > 0 ? Math.round((present / total) * 100) : null;

        // Today's status
        const today   = new Date().toISOString().split('T')[0];
        const todayAtt= (att || []).find((a) => a.date === today);

        return { ...t, present, absent, leave, rate, todayStatus: todayAtt?.status || null };
      }));

      setTrainers(results);
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--if-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Loading...</div>
        ) : trainers.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--if-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>No trainers found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--if-bg3)', borderBottom: '1px solid var(--if-border)' }}>
                  {['Trainer', 'Today', 'Present', 'Absent', 'Leave', 'Rate (Month)'].map((h) => (
                    <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)', padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trainers.map((t, i) => {
                  const name = fullName(t.profile);
                  return (
                    <tr key={t.id} style={{ borderBottom: i < trainers.length - 1 ? '1px solid var(--if-border)' : 'none' }}>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>{name}</p>
                        {t.specialization && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)' }}>{t.specialization}</p>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {t.todayStatus
                          ? <Badge variant={t.todayStatus} size="sm">{t.todayStatus}</Badge>
                          : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>Not marked</span>
                        }
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{t.present}</td>
                      <td style={{ padding: '12px 16px', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{t.absent}</td>
                      <td style={{ padding: '12px 16px', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: '#f97316' }}>{t.leave}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {t.rate !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: 'var(--if-bg3)', borderRadius: 10, overflow: 'hidden' }}>
                              <div style={{ width: `${t.rate}%`, height: '100%', background: t.rate >= 80 ? '#22c55e' : t.rate >= 60 ? '#f97316' : '#ef4444', borderRadius: 10 }} />
                            </div>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: t.rate >= 80 ? '#22c55e' : t.rate >= 60 ? '#f97316' : '#ef4444' }}>{t.rate}%</span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>No data</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 6 — Leads
// ════════════════════════════════════════════════════════════
function LeadsReport() {
  const supabase = createClient();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const months = last12Months();
      const start  = `${months[0]}-01`;

      const { data: leads } = await supabase
        .from('leads')
        .select('id, status, source, created_at')
        .gte('created_at', start);

      const byMonth = {};
      months.forEach((m) => (byMonth[m] = 0));
      (leads || []).forEach((l) => {
        const k = monthKey(l.created_at);
        if (byMonth[k] !== undefined) byMonth[k]++;
      });

      const byStatus = {};
      const bySource = {};
      (leads || []).forEach((l) => {
        byStatus[l.status] = (byStatus[l.status] || 0) + 1;
        bySource[l.source] = (bySource[l.source] || 0) + 1;
      });

      const total     = leads?.length || 0;
      const converted = byStatus['converted'] || 0;
      const convRate  = total > 0 ? Math.round((converted / total) * 100) : 0;

      setData({
        chartData: months.map((m) => ({ label: monthLabel(m), value: byMonth[m] })),
        total, converted, convRate, byStatus, bySource,
      });
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><Skeleton h={80} /><Skeleton h={200} /></div>;

  const STATUS_COLOR = { new: '#38bdf8', contacted: '#f97316', interested: '#a78bfa', converted: '#22c55e', lost: '#ef4444' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <SummaryCard icon={UserPlus} label="Total Leads (12m)"   value={data.total}       color="var(--if-accent)" bg="var(--if-accentbg2)" />
        <SummaryCard icon={Users}    label="Converted"           value={data.converted}   color="#22c55e"  bg="rgba(34,197,94,0.09)"  />
        <SummaryCard icon={TrendingUp} label="Conversion Rate"   value={`${data.convRate}%`} color="#a78bfa" bg="rgba(167,139,250,0.09)" />
      </div>

      <Section title="New Leads per Month" color="var(--if-accent)">
        <BarChart data={data.chartData} color="var(--if-accent)" />
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Section title="By Status" color="#38bdf8">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(data.byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--if-border)' }}>
                <Badge size="sm" variant={status === 'converted' ? 'active' : status === 'lost' ? 'expired' : 'yellow'} style={{ textTransform: 'capitalize' }}>{status}</Badge>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: STATUS_COLOR[status] || 'var(--if-text)' }}>{count}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="By Source" color="#a78bfa">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(data.bySource).sort((a, b) => b[1] - a[1]).map(([source, count]) => {
              const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
              return (
                <div key={source}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text)', textTransform: 'capitalize' }}>{source.replace('_', ' ')}</span>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--if-text)' }}>{count} <span style={{ color: 'var(--if-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 5, background: 'var(--if-bg3)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#a78bfa', borderRadius: 10 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN — ReportsView with tabs
// ════════════════════════════════════════════════════════════
const TABS = [
  { id: 'revenue',     label: 'Revenue',       icon: DollarSign,    color: '#22c55e'          },
  { id: 'members',     label: 'Members',       icon: Users,         color: '#38bdf8'          },
  { id: 'expiring',    label: 'Expiring',      icon: AlertTriangle, color: '#f97316'          },
  { id: 'attendance',  label: 'Attendance',    icon: DoorOpen,      color: 'var(--if-accent)' },
  { id: 'trainer_att', label: 'Trainer Att.',  icon: Dumbbell,      color: '#a78bfa'          },
  { id: 'leads',       label: 'Leads',         icon: UserPlus,      color: 'var(--if-accent)' },
];

export default function ReportsView({ defaultTab = 'revenue' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} @media print { body { background: #080808 !important; } }`}</style>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, padding: 6, flexWrap: 'wrap' }}>
          {TABS.map((tab) => {
            const Icon   = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  height: 36, padding: '0 14px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', transition: 'all .15s',
                  background: active ? tab.color : 'transparent',
                  color: active ? (tab.color === 'var(--if-accent)' ? '#000' : tab.color === '#a78bfa' ? '#fff' : '#000') : 'var(--if-text2)',
                  fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--if-bg3)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
      </div>

      {/* Tab content */}
      <div id="report-content">
        {activeTab === 'revenue'     && <RevenueReport />}
        {activeTab === 'members'     && <MembersReport />}
        {activeTab === 'expiring'    && <ExpiringReport />}
        {activeTab === 'attendance'  && <AttendanceReport />}
        {activeTab === 'trainer_att' && <TrainerAttendanceReport />}
        {activeTab === 'leads'       && <LeadsReport />}
      </div>
    </div>
  );
}
