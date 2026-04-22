'use client';

import { useState, useEffect } from 'react';
import { Search, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, fullName, initials, daysLeft, planLabel } from '@/utils/format';
import Badge from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

const T = {
  accent: '#39ff14', accentbg2: 'rgba(57,255,20,0.12)',
  card: '#111111', card2: '#1a1a1a', border: '#1f1f1f', border2: '#2a2a2a',
  text: '#f0f0f0', text2: '#888888', muted: '#444444',
  green: '#22c55e', red: '#ef4444',
};

export default function TrainerMembers() {
  const supabase = createClient();

  const [members,   setMembers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(null);
  const [detailOpen,setDetailOpen]= useState(false);

  useEffect(() => {
    async function fetch() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: trainer }  = await supabase.from('trainers').select('id').eq('profile_id', user.id).single();
      if (!trainer) { setLoading(false); return; }

      const { data } = await supabase
        .from('member_trainer_assignments')
        .select(`
          id, assigned_at,
          member:members(
            id, member_number, is_active, created_at,
            profile:profiles(first_name, last_name, email, phone),
            subscription:member_subscriptions(status, end_date, plan:membership_plans(billing_cycle))
          )
        `)
        .eq('trainer_id', trainer.id)
        .eq('is_active', true);

      setMembers((data || []).map((a) => a.member).filter(Boolean));
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = members.filter((m) => {
    const name = fullName(m.profile).toLowerCase();
    const s    = search.toLowerCase();
    return name.includes(s) || m.member_number?.toLowerCase().includes(s) || m.profile?.email?.toLowerCase().includes(s);
  });

  if (loading) return <PageSpinner />;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.card, border: `1px solid ${T.border2}`, borderRadius: 8, padding: '0 12px', height: 38, maxWidth: 320 }}
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = T.accent)}
          onBlurCapture={(e)  => (e.currentTarget.style.borderColor = T.border2)}
        >
          <Search size={14} style={{ color: T.text2, flexShrink: 0 }} />
          <input type="text" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.text, width: '100%' }}
          />
        </div>

        {/* Table */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.text2 }}>
              {search ? 'No members match your search.' : 'No members assigned yet.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0e0e0e', borderBottom: `1px solid ${T.border}` }}>
                    {['Member', 'Plan', 'Expires', 'Status', 'Action'].map((h) => (
                      <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: T.text2, padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const name = fullName(m.profile);
                    const ini  = initials(name);
                    const sub  = m.subscription?.find((s) => s.status === 'active') || m.subscription?.[0];
                    const days = daysLeft(sub?.end_date);
                    return (
                      <tr key={m.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none', transition: 'background .12s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = T.accentbg2)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 7, background: T.accentbg2, border: `1px solid ${T.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, color: T.accent, flexShrink: 0 }}>{ini}</div>
                            <div>
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: T.text }}>{name}</p>
                              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.text2 }}>{m.member_number}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant="yellow" size="sm">{planLabel(sub?.plan?.billing_cycle) || '—'}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: days !== null && days <= 7 ? T.red : T.text2, whiteSpace: 'nowrap' }}>
                          {formatDate(sub?.end_date) || '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant={sub?.status === 'active' ? 'active' : 'expired'}>{sub?.status || 'No plan'}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => { setSelected(m); setDetailOpen(true); }}
                            style={{ width: 30, height: 30, borderRadius: 7, background: 'transparent', border: `1px solid ${T.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text2, cursor: 'pointer', transition: 'all .15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text2; }}
                          >
                            <Eye size={13} />
                          </button>
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

      {/* Member detail modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={fullName(selected?.profile)} size="sm">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Email',  value: selected.profile?.email },
              { label: 'Phone',  value: selected.profile?.phone },
              { label: 'Member #', value: selected.member_number },
              { label: 'Member Since', value: formatDate(selected.created_at) },
              { label: 'Plan',   value: planLabel(selected.subscription?.find((s) => s.status === 'active')?.plan?.billing_cycle) },
              { label: 'Expires', value: formatDate(selected.subscription?.find((s) => s.status === 'active')?.end_date) },
            ].map((r) => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.text2 }}>{r.label}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.text }}>{r.value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
