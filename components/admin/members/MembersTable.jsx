'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, Filter, Eye, Edit, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { value: '',        label: 'All Status'  },
  { value: 'active',  label: 'Active'      },
  { value: 'expired', label: 'Expired'     },
  { value: 'frozen',  label: 'Frozen'      },
];

const PLAN_OPTIONS = [
  { value: '',          label: 'All Plans' },
  { value: 'day_pass',  label: 'Day Pass'  },
  { value: 'monthly',   label: 'Monthly'   },
  { value: 'yearly',    label: 'Yearly'    },
];

function realSubStatus(sub) {
  if (!sub) return null;
  if (sub.status === 'frozen') return 'frozen';
  const today = new Date().toISOString().split('T')[0];
  return sub.end_date < today ? 'expired' : 'active';
}

function Avatar({ name = '', size = 32 }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: 'var(--if-accentbg2)',
      border: '1px solid var(--if-border2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif",
      fontSize: size * 0.34, fontWeight: 700,
      color: 'var(--if-accent)', flexShrink: 0,
    }}>
      {initials || '?'}
    </div>
  );
}

export default function MembersTable() {
  const router   = useRouter();
  const supabase = createClient();

  const [members,  setMembers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [plan,     setPlan]     = useState('');

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('members')
        .select(`
          id, member_number, profile_pic_url, is_active, created_at,
          profile:profiles!members_profile_id_fkey(first_name, last_name, email, phone),
          subscription:member_subscriptions(
            status, start_date, end_date,
            plan:membership_plans(billing_cycle, price)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.or(
          `member_number.ilike.%${search}%,profile.first_name.ilike.%${search}%,profile.last_name.ilike.%${search}%,profile.email.ilike.%${search}%`
        );
      }

      if (plan) {
        query = query.eq('subscription.plan.billing_cycle', plan);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (status) {
        filtered = filtered.filter((m) => {
          const sub = m.subscription?.find((s) => s.status === 'active') || m.subscription?.[0];
          return realSubStatus(sub) === status;
        });
      }

      setMembers(filtered);
      setTotal(count || 0);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, plan]);

  useEffect(() => {
    const timer = setTimeout(fetchMembers, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  useEffect(() => { setPage(1); }, [search, status, plan]);

  function getActiveSub(member) {
    return member.subscription?.find((s) => s.status === 'active')
      || member.subscription?.[0];
  }

  function daysLeft(endDate) {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate) - new Date()) / 864e5);
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Toolbar ── */}
      <div style={{
        display:        'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>

          {/* Search */}
          <div style={{
            display:      'flex', alignItems: 'center', gap: 8,
            background:   'var(--if-card)',
            border:       '1px solid var(--if-border2)',
            borderRadius: 8, padding: '0 12px',
            height:       38, minWidth: 240, flex: 1, maxWidth: 340,
            transition:   'border-color .2s, box-shadow .2s',
          }}
            onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--if-accentbg)'; }}
            onBlurCapture={(e)  => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <Search size={14} style={{ color: 'var(--if-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: 'var(--if-text)', width: '100%',
              }}
            />
          </div>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              height: 38, background: 'var(--if-card)',
              border: '1px solid var(--if-border2)', borderRadius: 8,
              padding: '0 12px', fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, color: status ? 'var(--if-text)' : 'var(--if-muted)',
              cursor: 'pointer', outline: 'none', appearance: 'none',
              paddingRight: 32,
            }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Plan filter */}
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            style={{
              height: 38, background: 'var(--if-card)',
              border: '1px solid var(--if-border2)', borderRadius: 8,
              padding: '0 12px', fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, color: plan ? 'var(--if-text)' : 'var(--if-muted)',
              cursor: 'pointer', outline: 'none', appearance: 'none',
              paddingRight: 32,
            }}
          >
            {PLAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <Button icon={<UserPlus size={15} />} onClick={() => router.push('/admin/members/new')}>
          Add Member
        </Button>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: 'var(--if-card)', border: '1px solid var(--if-border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '60px 0' }}><PageSpinner /></div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No members found"
            message={search || status || plan ? 'Try adjusting your filters.' : 'Add your first member to get started.'}
            action={
              <Button icon={<UserPlus size={15} />} onClick={() => router.push('/admin/members/new')}>
                Add Member
              </Button>
            }
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--if-bg3)', borderBottom: '1px solid var(--if-border)' }}>
                    {['Member', 'ID', 'Plan', 'Status', 'Expiry', 'Phone', 'Actions'].map((h) => (
                      <th key={h} style={{
                        fontFamily:    "'Outfit', sans-serif",
                        fontSize:      10, fontWeight: 700,
                        letterSpacing: '.12em', textTransform: 'uppercase',
                        color:         'var(--if-muted)',
                        padding:       '10px 16px', textAlign: 'left', whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, i) => {
                    const sub       = getActiveSub(member);
                    const subStatus = realSubStatus(sub);
                    const name      = `${member.profile?.first_name || ''} ${member.profile?.last_name || ''}`.trim();
                    const days      = daysLeft(sub?.end_date);
                    const expiring  = days !== null && days <= 14 && days > 0;
                    const expired   = subStatus === 'expired';

                    return (
                      <tr
                        key={member.id}
                        style={{ borderBottom: i < members.length - 1 ? '1px solid var(--if-border)' : 'none', transition: 'background .12s', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--if-accentbg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => router.push(`/admin/members/${member.id}`)}
                      >
                        {/* Member */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={name} />
                            <div>
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)', lineHeight: 1.3 }}>
                                {name || 'Unknown'}
                              </p>
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)' }}>
                                {member.profile?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ID */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--if-text2)' }}>
                            {member.member_number}
                          </span>
                        </td>

                        {/* Plan */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          {sub?.plan?.billing_cycle ? (
                            <Badge variant="yellow">
                              {sub.plan.billing_cycle.replace('_', ' ')}
                            </Badge>
                          ) : '—'}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <Badge variant={subStatus || 'default'}>
                            {subStatus || 'No plan'}
                          </Badge>
                        </td>

                        {/* Expiry */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            color: expired ? 'var(--if-red)' : expiring ? '#f97316' : 'var(--if-text2)',
                            fontWeight: (expired || expiring) ? 600 : 400,
                          }}>
                            {formatDate(sub?.end_date)}
                            {expiring && !expired && (
                              <span style={{ fontSize: 11, color: '#f97316', marginLeft: 6 }}>
                                ({days}d left)
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Phone */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text2)' }}>
                            {member.profile?.phone || '—'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => router.push(`/admin/members/${member.id}`)}
                              title="View"
                              style={{
                                width: 30, height: 30, borderRadius: 7,
                                background: 'transparent', border: '1px solid var(--if-border2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--if-text2)', cursor: 'pointer', transition: 'all .15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => router.push(`/admin/members/${member.id}/edit`)}
                              title="Edit"
                              style={{
                                width: 30, height: 30, borderRadius: 7,
                                background: 'transparent', border: '1px solid var(--if-border2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--if-text2)', cursor: 'pointer', transition: 'all .15s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
                            >
                              <Edit size={13} />
                            </button>
                            {(expired || expiring) && (
                              <button
                                onClick={() => router.push(`/admin/members/${member.id}?tab=subscription`)}
                                title="Renew"
                                style={{
                                  height: 30, padding: '0 10px', borderRadius: 7,
                                  background: 'var(--if-accentbg2)',
                                  border: '1px solid var(--if-accent)',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  color: 'var(--if-accent)', cursor: 'pointer', transition: 'all .15s',
                                  fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700,
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--if-accent)'; e.currentTarget.style.color = '#000'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--if-accentbg2)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
                              >
                                <RefreshCw size={11} /> Renew
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

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderTop: '1px solid var(--if-border)',
              flexWrap: 'wrap', gap: 8,
            }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} members
              </p>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
