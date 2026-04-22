'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, User, Dumbbell, UserPlus, BarChart2, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';
import AdminShell from '@/components/admin/layout/AdminShell';
import { PageSpinner } from '@/components/ui/Spinner';

const REPORT_TABS = [
  { label: 'Revenue Report',       tab: 'revenue'     },
  { label: 'Members Report',       tab: 'members'     },
  { label: 'Expiring Memberships', tab: 'expiring'    },
  { label: 'Attendance Report',    tab: 'attendance'  },
  { label: 'Trainer Attendance',   tab: 'trainer_att' },
  { label: 'Leads Report',         tab: 'leads'       },
];

function Section({ icon: Icon, iconColor, title, count, children }) {
  if (!count) return null;
  return (
    <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--if-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={14} style={{ color: iconColor }} />
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--if-text)' }}>{title}</span>
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: 'var(--if-muted)' }}>({count})</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ResultRow({ onClick, children }) {
  return (
    <div onClick={onClick}
      style={{ padding: '12px 18px', borderBottom: '1px solid var(--if-border)', cursor: 'pointer', transition: 'background .12s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--if-accentbg)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </div>
  );
}

function SearchContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const q            = searchParams.get('q') || '';
  const supabase     = createClient();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q || q.trim().length < 2) { setResults(null); return; }
    async function run() {
      setLoading(true);
      const s = q.toLowerCase();
      const reports = REPORT_TABS.filter((r) => r.label.toLowerCase().includes(s));
      try {
        const [{ data: members }, { data: trainers }, { data: leads }] = await Promise.all([
          supabase.from('members').select('id, member_number, is_active, profile:profiles(first_name, last_name, email), subscription:member_subscriptions(status, end_date)').limit(50),
          supabase.from('trainers').select('id, specialization, is_active, profile:profiles(first_name, last_name, email)').limit(50),
          supabase.from('leads').select('id, first_name, last_name, phone, email, status, source').or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`).limit(20),
        ]);
        const fm = (members  || []).filter((m) => { const n = `${m.profile?.first_name||''} ${m.profile?.last_name||''}`.toLowerCase(); return n.includes(s) || m.profile?.email?.toLowerCase().includes(s) || m.member_number?.toLowerCase().includes(s); });
        const ft = (trainers || []).filter((t) => { const n = `${t.profile?.first_name||''} ${t.profile?.last_name||''}`.toLowerCase(); return n.includes(s) || t.profile?.email?.toLowerCase().includes(s); });
        setResults({ members: fm, trainers: ft, leads: leads || [], reports });
      } catch (err) {
        console.error('Search error:', err?.message);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [q]);

  const total = results ? results.members.length + results.trainers.length + results.leads.length + results.reports.length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-muted)', padding: 0 }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-accent)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}>
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--if-card)', border: '1px solid var(--if-accent)', borderRadius: 8, padding: '0 14px', height: 38, flex: 1, maxWidth: 400 }}>
          <Search size={14} style={{ color: 'var(--if-accent)', flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)' }}>{q}</span>
        </div>
        {results && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>{total} result{total !== 1 ? 's' : ''}</span>}
      </div>

      {loading ? <PageSpinner /> : !results ? (
        <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, padding: '60px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>Enter a search term to begin.</p>
        </div>
      ) : total === 0 ? (
        <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, padding: '60px 0', textAlign: 'center' }}>
          <Search size={32} style={{ color: 'var(--if-muted)', marginBottom: 12 }} />
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--if-text)', marginBottom: 6 }}>No results found</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>Try a different search term</p>
        </div>
      ) : (
        <>
          <Section icon={User} iconColor="var(--if-accent)" title="Members" count={results.members.length}>
            {results.members.map((m) => { const name = `${m.profile?.first_name||''} ${m.profile?.last_name||''}`.trim(); const sub = m.subscription?.find((s) => s.status === 'active') || m.subscription?.[0]; return (<ResultRow key={m.id} onClick={() => router.push(`/admin/members/${m.id}`)}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--if-accentbg2)', border: '1px solid var(--if-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--if-accent)', flexShrink: 0 }}>{name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0,2)}</div><div><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>{name}</p><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)' }}>{m.profile?.email}</p></div></div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--if-muted)' }}>{m.member_number}</span><Badge variant={sub?.status === 'active' ? 'active' : 'expired'} size="sm">{sub?.status || 'No plan'}</Badge></div></ResultRow>); })}
          </Section>
          <Section icon={Dumbbell} iconColor="#a78bfa" title="Trainers" count={results.trainers.length}>
            {results.trainers.map((t) => { const name = `${t.profile?.first_name||''} ${t.profile?.last_name||''}`.trim(); return (<ResultRow key={t.id} onClick={() => router.push(`/admin/trainers/${t.id}`)}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,0.12)', border: '1px solid #a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: '#a78bfa', flexShrink: 0 }}>{name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0,2)}</div><div><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>{name}</p><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)' }}>{t.specialization || t.profile?.email}</p></div></div><Badge variant={t.is_active ? 'active' : 'expired'} size="sm">{t.is_active ? 'Active' : 'Inactive'}</Badge></ResultRow>); })}
          </Section>
          <Section icon={UserPlus} iconColor="#38bdf8" title="Leads" count={results.leads.length}>
            {results.leads.map((l) => { const name = `${l.first_name||''} ${l.last_name||''}`.trim(); return (<ResultRow key={l.id} onClick={() => router.push(`/admin/crm/${l.id}`)}><div><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>{name}</p><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)' }}>{l.phone || l.email}</p></div><div style={{ display: 'flex', gap: 8 }}><Badge variant="yellow" size="sm">{l.source?.replace('_',' ')}</Badge><Badge variant={l.status==='new'?'blue':'yellow'} size="sm">{l.status}</Badge></div></ResultRow>); })}
          </Section>
          <Section icon={BarChart2} iconColor="#22c55e" title="Reports" count={results.reports.length}>
            {results.reports.map((r) => (<ResultRow key={r.tab} onClick={() => router.push(`/admin/reports?tab=${r.tab}`)}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.09)', border: '1px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BarChart2 size={14} style={{ color: '#22c55e' }} /></div><p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>{r.label}</p></div><span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: '#22c55e' }}>View →</span></ResultRow>))}
          </Section>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <AdminShell topbarProps={{ title: 'Search Results', subtitle: 'Members, trainers, leads and reports' }}>
      <Suspense fallback={<PageSpinner />}>
        <SearchContent />
      </Suspense>
    </AdminShell>
  );
}
