'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency, daysLeft, planLabel } from '@/utils/format';

const M = {
  accent: '#E8FF00', accentbg: 'rgba(232,255,0,0.08)', accentbg2: 'rgba(232,255,0,0.14)',
  card: '#111111', card2: '#1a1a1a', border: '#1f1f1f', border2: '#2a2a2a',
  text: '#f0f0f0', text2: '#888888', muted: '#444444',
  green: '#22c55e', greenbg: 'rgba(34,197,94,0.09)',
  red: '#ef4444', redbg: 'rgba(239,68,68,0.09)',
  orange: '#f97316', orangebg: 'rgba(249,115,22,0.09)',
};

function SubCard({ sub, active }) {
  const days = daysLeft(sub.end_date);
  const color = sub.status === 'active'
    ? (days !== null && days <= 7 ? M.red : days !== null && days <= 14 ? M.orange : M.green)
    : M.text2;

  return (
    <div style={{
      background:   active ? M.accentbg2 : M.card,
      border:       `1px solid ${active ? M.accent : M.border}`,
      borderRadius: 14,
      padding:      '20px',
      position:     'relative',
      overflow:     'hidden',
    }}>
      {active && (
        <div style={{ position: 'absolute', top: 14, right: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: M.greenbg, border: `1px solid ${M.green}` }}>
            <CheckCircle2 size={11} style={{ color: M.green }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: M.green }}>Active</span>
          </div>
        </div>
      )}

      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color: active ? M.accent : M.text, lineHeight: 1, marginBottom: 4 }}>
        {planLabel(sub.plan?.billing_cycle)}
      </p>
      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: active ? M.accent : M.text2, marginBottom: 16 }}>
        {formatCurrency(sub.plan?.price)}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Start Date', value: formatDate(sub.start_date) },
          { label: 'End Date',   value: formatDate(sub.end_date)   },
          { label: 'Status',     value: sub.status                  },
          { label: 'Days Left',  value: days !== null ? (days <= 0 ? 'Expired' : `${days} days`) : '—' },
        ].map((r) => (
          <div key={r.label} style={{ background: M.card2, borderRadius: 8, padding: '10px 12px' }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: M.text2, marginBottom: 3 }}>{r.label}</p>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: M.text }}>{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MemberSubscription() {
  const supabase = createClient();
  const [subs,    setSubs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: member }   = await supabase.from('members').select('id').eq('profile_id', user.id).single();
      if (!member) { setLoading(false); return; }

      const { data } = await supabase
        .from('member_subscriptions')
        .select('id, status, start_date, end_date, plan:membership_plans(billing_cycle, price)')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false });

      setSubs(data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: M.text2 }}>Loading...</div>;

  const activeSub = subs.find((s) => s.status === 'active');
  const pastSubs  = subs.filter((s) => s.status !== 'active');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color: M.text }}>My Subscription</h2>

      {activeSub ? (
        <SubCard sub={activeSub} active />
      ) : (
        <div style={{ background: M.redbg, border: `1px solid ${M.red}`, borderRadius: 14, padding: '24px', textAlign: 'center' }}>
          <XCircle size={32} style={{ color: M.red, marginBottom: 10 }} />
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: M.red }}>No Active Subscription</p>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: M.text2, marginTop: 6 }}>Contact the gym to renew your membership.</p>
        </div>
      )}

      {pastSubs.length > 0 && (
        <>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 1, color: M.text2 }}>History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pastSubs.map((s) => <SubCard key={s.id} sub={s} active={false} />)}
          </div>
        </>
      )}
    </div>
  );
}