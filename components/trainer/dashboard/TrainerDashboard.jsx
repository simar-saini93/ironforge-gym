'use client';

import dynamic from 'next/dynamic';
const HolidayRibbon = dynamic(() => import('@/components/shared/HolidayRibbon'), { ssr: false });

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, CalendarDays, CheckCircle2, XCircle,
  TrendingUp, Clock, AlertTriangle, Dumbbell,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, fullName, initials } from '@/utils/format';

const T = {
  accent:    '#22c55e',
  accentbg:  'rgba(34,197,94,0.08)',
  accentbg2: 'rgba(34,197,94,0.14)',
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

// ── Stat card — member portal style ─────────────────────────
function StatCard({ icon: Icon, label, value, color, bg, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: '20px',
      cursor: onClick ? 'pointer' : 'default', transition: 'all .2s',
    }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: T.text2 }}>
          {label}
        </span>
      </div>
      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 1, color: T.text, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

function Skeleton({ h = 100 }) {
  return <div style={{ height: h, borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, animation: 'pulse 1.5s infinite' }} />;
}

export default function TrainerDashboard() {
  const router   = useRouter();
  const supabase = createClient();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles').select('first_name, last_name, branch_id').eq('id', user.id).single();

      const { data: trainer } = await supabase
        .from('trainers').select('id, specialization').eq('profile_id', user.id).single();

      if (!trainer) { setLoading(false); return; }

      const [{ data: assignments }, { data: todayAtt }, { data: attHistory }] = await Promise.all([
        supabase
          .from('member_trainer_assignments')
          .select('id, member:members(id, member_number, profile:profiles(first_name, last_name))')
          .eq('trainer_id', trainer.id).eq('is_active', true),

        supabase
          .from('trainer_attendance')
          .select('id, status').eq('trainer_id', trainer.id).eq('date', today).maybeSingle(),

        supabase
          .from('trainer_attendance')
          .select('status').eq('trainer_id', trainer.id).order('date', { ascending: false }).limit(30),
      ]);

      const presentCount = (attHistory || []).filter((a) => a.status === 'present').length;
      const attRate      = attHistory?.length > 0 ? Math.round((presentCount / attHistory.length) * 100) : 0;

      setData({ profile, trainer, assignments: assignments || [], todayAtt, attRate, presentCount });
    } catch (err) {
      console.error('Trainer dashboard error:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function markAttendance(status) {
    if (!data?.trainer) return;
    setMarking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile }  = await supabase.from('profiles').select('branch_id').eq('id', user.id).single();
      await supabase.from('trainer_attendance').upsert({
        trainer_id: data.trainer.id,
        branch_id:  profile.branch_id,
        date:       today,
        status,
        marked_by:  user.id,
      }, { onConflict: 'trainer_id,date' });
      fetchData();
    } catch (err) {
      console.error('Mark attendance error:', err?.message);
    } finally {
      setMarking(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        <Skeleton h={88} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[1,2,3,4].map((n) => <Skeleton key={n} h={120} />)}
        </div>
        <Skeleton h={160} />
        <Skeleton h={200} />
      </div>
    );
  }

  if (!data) return (
    <div style={{ textAlign: 'center', padding: 40, color: T.text2, fontFamily: "'Barlow', sans-serif" }}>
      No trainer profile found. Contact admin.
    </div>
  );

  const { profile, trainer, assignments, todayAtt, attRate, presentCount } = data;
  const firstName = profile?.first_name || 'Trainer';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* ── Holiday ribbon ── */}
      <HolidayRibbon />

      {/* Welcome banner */}
      <div style={{
        background: T.accentbg2, border: `1px solid ${T.accent}`,
        borderRadius: 14, padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: T.accent, marginBottom: 4 }}>
            Welcome back
          </p>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 1, color: T.text, lineHeight: 1 }}>
            {firstName}
          </h1>
          {trainer.specialization && (
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: T.text2, marginTop: 4 }}>
              {trainer.specialization}
            </p>
          )}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: T.accentbg, border: `1px solid ${T.accent}` }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent }} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.accent }}>
            Active Trainer
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        <StatCard icon={Users}        label="My Members"      value={String(assignments.length)} color={T.accent}  bg={T.accentbg2} onClick={() => router.push('/trainer/members')} />
        <StatCard icon={TrendingUp}   label="Attendance Rate" value={`${attRate}%`}              color={T.green}   bg={T.greenbg}   onClick={() => router.push('/trainer/attendance')} />
        <StatCard icon={CalendarDays} label="Days Present"    value={String(presentCount)}       color={T.orange}  bg={T.orangebg}  onClick={() => router.push('/trainer/attendance')} />
        <StatCard icon={Clock}        label="Today"           value={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} color="#38bdf8" bg="rgba(56,189,248,0.09)" />
      </div>

      {/* Today's attendance card */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 1, color: T.text }}>Today's Attendance</span>
          <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.text2 }}>{formatDate(new Date())}</span>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {todayAtt ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10,
                background: todayAtt.status === 'present' ? T.greenbg : todayAtt.status === 'absent' ? T.redbg : T.orangebg,
                border: `1px solid ${todayAtt.status === 'present' ? T.green : todayAtt.status === 'absent' ? T.red : T.orange}`,
              }}>
                {todayAtt.status === 'present'
                  ? <CheckCircle2 size={16} style={{ color: T.green }} />
                  : <XCircle     size={16} style={{ color: todayAtt.status === 'absent' ? T.red : T.orange }} />
                }
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '.1em', textTransform: 'capitalize', color: todayAtt.status === 'present' ? T.green : todayAtt.status === 'absent' ? T.red : T.orange }}>
                  {todayAtt.status}
                </span>
              </div>
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: T.text2 }}>Marked for today</span>
            </div>
          ) : (
            <>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: T.text2, marginBottom: 16 }}>
                Mark your attendance for today.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { status: 'present', label: 'Present',  color: T.green,  bg: T.greenbg  },
                  { status: 'absent',  label: 'Absent',   color: T.red,    bg: T.redbg    },
                  { status: 'leave',   label: 'On Leave', color: T.orange, bg: T.orangebg },
                ].map((opt) => (
                  <button key={opt.status} onClick={() => markAttendance(opt.status)} disabled={marking}
                    style={{ flex: 1, height: 44, borderRadius: 10, border: `1px solid ${opt.color}`, background: opt.bg, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: opt.color, cursor: 'pointer', transition: 'all .15s', opacity: marking ? 0.6 : 1 }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Assigned members */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 1, color: T.text }}>
            My Members ({assignments.length})
          </span>
          <button onClick={() => router.push('/trainer/members')}
            style={{ background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.accent, cursor: 'pointer', opacity: .85 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '.85')}
          >
            View All
          </button>
        </div>

        {assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Dumbbell size={28} style={{ color: T.muted, marginBottom: 10 }} />
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: T.text2 }}>No members assigned yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, padding: 16 }}>
            {assignments.slice(0, 6).map((a) => {
              const name = fullName(a.member?.profile);
              const ini  = initials(name);
              return (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: T.card2,
                  border: `1px solid ${T.border}`, borderRadius: 10,
                  cursor: 'pointer', transition: 'border-color .15s',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accentbg2, border: `1px solid ${T.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, color: T.accent, flexShrink: 0 }}>
                    {ini}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.text2 }}>{a.member?.member_number}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
