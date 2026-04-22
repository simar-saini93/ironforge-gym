'use client';

import dynamic from 'next/dynamic';
const HolidayRibbon = dynamic(() => import('@/components/shared/HolidayRibbon'), { ssr: false });

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, CalendarDays, Mail, CheckCircle2,
  AlertTriangle, Clock, Dumbbell, QrCode,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, daysLeft, planLabel, formatCurrency } from '@/utils/format';

const M = {
  accent:    '#E8FF00',
  accentbg:  'rgba(232,255,0,0.08)',
  accentbg2: 'rgba(232,255,0,0.14)',
  card:      '#111111',
  card2:     '#1a1a1a',
  border:    '#1f1f1f',
  border2:   '#2a2a2a',
  text:      '#f0f0f0',
  text2:     '#888888',
  muted:     '#444444',
  green:     '#22c55e',
  greenbg:   'rgba(34,197,94,0.09)',
  red:       '#ef4444',
  redbg:     'rgba(239,68,68,0.09)',
  orange:    '#f97316',
  orangebg:  'rgba(249,115,22,0.09)',
};

// ── Stat card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background:   M.card,
        border:       `1px solid ${M.border}`,
        borderRadius: 14,
        padding:      '20px',
        cursor:       onClick ? 'pointer' : 'default',
        transition:   'all .2s',
      }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.borderColor = M.accent; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = M.border; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: M.text2 }}>
          {label}
        </span>
      </div>
      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 1, color: M.text, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────
function Skeleton({ h = 100, radius = 14 }) {
  return (
    <div style={{ height: h, borderRadius: radius, background: M.card, border: `1px solid ${M.border}`, animation: 'pulse 1.5s infinite' }} />
  );
}

export default function MemberDashboard() {
  const router   = useRouter();
  const supabase = createClient();

  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [requestingCode,setRequestingCode]= useState(false);
  const [codeSent,      setCodeSent]      = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      const { data: member } = await supabase
        .from('members')
        .select(`
          id, member_number, profile_pic_url, created_at,
          subscription:member_subscriptions(
            id, status, start_date, end_date,
            plan:membership_plans(billing_cycle, price)
          ),
          trainer:member_trainer_assignments(
            is_active,
            trainer:trainers(
              specialization,
              profile:profiles(first_name, last_name)
            )
          )
        `)
        .eq('profile_id', user.id)
        .single();

      const { count: attendanceCount } = await supabase
        .from('access_logs')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', member?.id)
        .eq('status', 'granted');

      const { data: recentPayments } = await supabase
        .from('payments')
        .select('id, amount, payment_date, payment_method')
        .eq('member_id', member?.id)
        .order('payment_date', { ascending: false })
        .limit(3);

      setData({ profile, member, attendanceCount: attendanceCount || 0, recentPayments: recentPayments || [] });
    } catch (err) {
      console.error('Member dashboard error:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestCode() {
    setRequestingCode(true);
    try {
      const res = await fetch('/api/member/request-code', { method: 'POST' });
      if (res.ok) { setCodeSent(true); setTimeout(() => setCodeSent(false), 5000); }
      else { alert('Failed to send code. Please try again.'); }
    } catch {
      alert('Failed to send code. Please try again.');
    } finally {
      setRequestingCode(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton h={80} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {[1,2,3,4].map((n) => <Skeleton key={n} h={120} />)}
        </div>
        <Skeleton h={200} />
      </div>
    );
  }

  const { profile, member, attendanceCount, recentPayments } = data || {};
  const activeSub = member?.subscription?.find((s) => s.status === 'active') || member?.subscription?.[0];
  const days      = daysLeft(activeSub?.end_date);
  const trainer   = member?.trainer?.find((t) => t.is_active)?.trainer;
  const firstName = profile?.first_name || 'Member';

  const subColor = days === null ? M.text2
    : days <= 0  ? M.red
    : days <= 7  ? M.red
    : days <= 14 ? M.orange
    : M.green;

  const subBg = days === null ? M.card2
    : days <= 0  ? M.redbg
    : days <= 7  ? M.redbg
    : days <= 14 ? M.orangebg
    : M.greenbg;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>

      {/* ── Holiday ribbon ── */}
      <HolidayRibbon />

      {/* ── Welcome banner ── */}
      <div style={{
        background:   M.accentbg2,
        border:       `1px solid ${M.accent}`,
        borderRadius: 14,
        padding:      '20px 24px',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        flexWrap:     'wrap',
        gap:          12,
      }}>
        <div>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: M.accent, marginBottom: 4 }}>
            Welcome back
          </p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 1, color: M.text, lineHeight: 1 }}>
            {firstName}
          </h1>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: M.text2, marginTop: 4 }}>
            Member #{member?.member_number} · Joined {formatDate(member?.created_at)}
          </p>
        </div>
        {activeSub && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: subBg, border: `1px solid ${subColor}` }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: subColor }} />
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: subColor }}>
                {days !== null && days <= 0 ? 'Expired' : activeSub.status}
              </span>
            </div>
            {days !== null && days > 0 && (
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: M.text2, marginTop: 4 }}>
                {days} day{days !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <StatCard
          icon={CreditCard}
          label="Current Plan"
          value={planLabel(activeSub?.plan?.billing_cycle) || 'No Plan'}
          color={M.accent}
          bg={M.accentbg2}
          onClick={() => router.push('/member/subscription')}
        />
        <StatCard
          icon={Clock}
          label="Expiry"
          value={formatDate(activeSub?.end_date) || '—'}
          color={subColor}
          bg={subBg}
          onClick={() => router.push('/member/subscription')}
        />
        <StatCard
          icon={CalendarDays}
          label="Check-ins"
          value={String(attendanceCount)}
          color={M.green}
          bg={M.greenbg}
          onClick={() => router.push('/member/attendance')}
        />
        <StatCard
          icon={Dumbbell}
          label="Trainer"
          value={trainer ? `${trainer.profile?.first_name} ${trainer.profile?.last_name}` : 'Not Assigned'}
          color="#a78bfa"
          bg="rgba(167,139,250,0.09)"
          onClick={() => router.push('/member/trainer')}
        />
      </div>

      {/* ── Access code card ── */}
      <div style={{
        background:   M.card,
        border:       `1px solid ${M.border}`,
        borderRadius: 14,
        padding:      '22px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: M.accentbg2, border: `1px solid ${M.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={22} style={{ color: M.accent }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1, color: M.text, lineHeight: 1 }}>
                Daily Access Code
              </p>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: M.text2, marginTop: 3 }}>
                {codeSent
                  ? 'Code sent to your email ✓'
                  : 'Get your 4-digit code to enter the gym'
                }
              </p>
            </div>
          </div>

          {codeSent ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: M.greenbg, border: `1px solid ${M.green}` }}>
              <CheckCircle2 size={16} style={{ color: M.green }} />
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: M.green }}>
                Check your email
              </span>
            </div>
          ) : (
            <button
              onClick={handleRequestCode}
              disabled={requestingCode || !activeSub || activeSub.status !== 'active'}
              style={{
                height:       44,
                padding:      '0 24px',
                borderRadius: 10,
                background:   (!activeSub || activeSub.status !== 'active') ? M.card2 : M.accent,
                color:        (!activeSub || activeSub.status !== 'active') ? M.muted : '#000',
                border:       'none',
                fontFamily:   "'Barlow Condensed', sans-serif",
                fontSize:     13,
                fontWeight:   700,
                letterSpacing:'.1em',
                textTransform:'uppercase',
                cursor:       (!activeSub || activeSub.status !== 'active') ? 'not-allowed' : 'pointer',
                transition:   'all .2s',
                display:      'flex',
                alignItems:   'center',
                gap:          8,
              }}
              onMouseEnter={(e) => { if (activeSub?.status === 'active') { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <Mail size={15} />
              {requestingCode ? 'Sending...' : 'Send to Email'}
            </button>
          )}
        </div>

        {(!activeSub || activeSub.status !== 'active') && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: M.redbg, borderRadius: 8, border: `1px solid ${M.red}` }}>
            <AlertTriangle size={14} style={{ color: M.red, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: M.red }}>
              Your membership is not active. Contact the gym to renew.
            </span>
          </div>
        )}
      </div>

      {/* ── Recent payments ── */}
      {recentPayments.length > 0 && (
        <div style={{ background: M.card, border: `1px solid ${M.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${M.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 1, color: M.text }}>Recent Payments</span>
            <button onClick={() => router.push('/member/payments')}
              style={{ background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: M.accent, cursor: 'pointer', opacity: .85 }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '.85')}
            >
              View All
            </button>
          </div>
          {recentPayments.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < recentPayments.length - 1 ? `1px solid ${M.border}` : 'none' }}>
              <div>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: M.text }}>{formatDate(p.payment_date)}</p>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: M.text2, textTransform: 'capitalize' }}>{p.payment_method?.replace('_', ' ')}</p>
              </div>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 1, color: M.green }}>
                {formatCurrency(p.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
