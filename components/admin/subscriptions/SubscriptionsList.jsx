'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, Snowflake } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency, fullName, daysLeft, planLabel } from '@/utils/format';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import RenewModal from '@/components/admin/members/RenewModal';

const PAGE_SIZE = 20;

export default function SubscriptionsList() {
  const router   = useRouter();
  const supabase = createClient();

  const [subs,       setSubs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [renewTarget, setRenewTarget] = useState(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('member_subscriptions')
        .select(`
          id, status, start_date, end_date,
          plan:membership_plans(billing_cycle, price),
          member:members(id, member_number, profile:profiles(first_name, last_name))
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (status) query = query.eq('status', status);

      const { data, count, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter((sub) =>
          fullName(sub.member?.profile).toLowerCase().includes(s) ||
          sub.member?.member_number?.toLowerCase().includes(s)
        );
      }

      setSubs(filtered);
      setTotal(count || 0);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const t = setTimeout(fetchSubs, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchSubs]);

  useEffect(() => { setPage(1); }, [search, status]);

  async function handleFreeze(subId) {
    if (!confirm('Freeze this subscription?')) return;
    await supabase.from('member_subscriptions').update({ status: 'frozen' }).eq('id', subId);
    fetchSubs();
  }

  async function handleUnfreeze(subId) {
    await supabase.from('member_subscriptions').update({ status: 'active' }).eq('id', subId);
    fetchSubs();
  }

  const filterStyle = { height: 38, background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text2)', cursor: 'pointer', outline: 'none', appearance: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '0 12px', height: 38, minWidth: 260, flex: 1, maxWidth: 360 }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; }}
          onBlurCapture={(e)  => { e.currentTarget.style.borderColor = 'var(--if-border2)'; }}
        >
          <Search size={14} style={{ color: 'var(--if-muted)', flexShrink: 0 }} />
          <input type="text" placeholder="Search member..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', width: '100%' }}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={filterStyle}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="frozen">Frozen</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '60px 0' }}><PageSpinner /></div>
        : subs.length === 0 ? (
          <EmptyState icon={Search} title="No subscriptions found" message="No subscriptions match your filters." />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--if-bg3)', borderBottom: '1px solid var(--if-border)' }}>
                    {['Member', 'Plan', 'Start', 'End', 'Days Left', 'Status', 'Actions'].map((h) => (
                      <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)', padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subs.map((sub, i) => {
                    const name = fullName(sub.member?.profile);
                    const days = daysLeft(sub.end_date);
                    const urgent = days !== null && days <= 7 && days >= 0;
                    const expiring = days !== null && days <= 14 && days > 7;

                    return (
                      <tr key={sub.id}
                        style={{ borderBottom: i < subs.length - 1 ? '1px solid var(--if-border)' : 'none', cursor: 'pointer', transition: 'background .12s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--if-accentbg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => router.push(`/admin/members/${sub.member?.id}`)}
                      >
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>{name}</p>
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--if-muted)' }}>{sub.member?.member_number}</p>
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Badge variant="yellow" size="sm">{planLabel(sub.plan?.billing_cycle)}</Badge>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, color: 'var(--if-muted)' }}>{formatCurrency(sub.plan?.price)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)', whiteSpace: 'nowrap' }}>{formatDate(sub.start_date)}</td>
                        <td style={{ padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: urgent ? 'var(--if-red)' : expiring ? '#f97316' : 'var(--if-text2)', whiteSpace: 'nowrap', fontWeight: urgent || expiring ? 600 : 400 }}>{formatDate(sub.end_date)}</td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: days === null ? 'var(--if-muted)' : days < 0 ? 'var(--if-red)' : urgent ? 'var(--if-red)' : expiring ? '#f97316' : 'var(--if-text)' }}>
                            {days === null ? '—' : days < 0 ? 'Expired' : `${days}d`}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}><Badge variant={sub.status}>{sub.status}</Badge></td>
                        <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setRenewTarget({ id: sub.member?.id, name })} title="Renew"
                              style={{ width: 30, height: 30, borderRadius: 7, background: 'transparent', border: '1px solid var(--if-border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--if-text2)', cursor: 'pointer', transition: 'all .15s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
                            >
                              <RefreshCw size={12} />
                            </button>
                            {sub.status === 'active' && (
                              <button onClick={() => handleFreeze(sub.id)} title="Freeze"
                                style={{ width: 30, height: 30, borderRadius: 7, background: 'transparent', border: '1px solid var(--if-border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--if-text2)', cursor: 'pointer', transition: 'all .15s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.color = '#38bdf8'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
                              >
                                <Snowflake size={12} />
                              </button>
                            )}
                            {sub.status === 'frozen' && (
                              <button onClick={() => handleUnfreeze(sub.id)} title="Unfreeze"
                                style={{ height: 30, padding: '0 10px', borderRadius: 7, background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, color: '#38bdf8', cursor: 'pointer', transition: 'all .15s' }}
                              >
                                Unfreeze
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--if-border)', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>
                Showing {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, total)} of {total} subscriptions
              </p>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </div>
          </>
        )}
      </div>

      {renewTarget && (
        <RenewModal open={!!renewTarget} onClose={() => setRenewTarget(null)} memberId={renewTarget.id} memberName={renewTarget.name} onSuccess={() => { setRenewTarget(null); fetchSubs(); }} />
      )}
    </div>
  );
}
