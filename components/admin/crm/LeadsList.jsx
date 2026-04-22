'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, Phone, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/utils/format';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import CreateLeadModal from '@/components/admin/crm/CreateLeadModal';

const PAGE_SIZE = 15;

const SOURCE_OPTS = [
  { value: '',           label: 'All Sources' },
  { value: 'walk_in',    label: 'Walk-in'     },
  { value: 'referral',   label: 'Referral'    },
  { value: 'instagram',  label: 'Instagram'   },
  { value: 'facebook',   label: 'Facebook'    },
  { value: 'google',     label: 'Google'      },
  { value: 'website',    label: 'Website'     },
  { value: 'other',      label: 'Other'       },
];

const STATUS_VARIANT = {
  new:        'blue',
  contacted:  'yellow',
  interested: 'purple',
  converted:  'active',
  lost:       'expired',
};

const ACTIVE_STATUSES = ['new', 'contacted', 'interested'];

export default function LeadsList() {
  const router   = useRouter();
  const supabase = createClient();

  const [leads,      setLeads]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [source,     setSource]     = useState('');
  const [showAll,    setShowAll]    = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCount,   setNewCount]   = useState(0);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select('id, first_name, last_name, email, phone, source, status, notes, created_at, converted_member_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (!showAll) query = query.in('status', ACTIVE_STATUSES);
      else query = query.in('status', [...ACTIVE_STATUSES, 'lost']); // converted are deleted from DB
      if (source)   query = query.eq('source', source);
      if (search.trim()) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);

      // Also get count of untouched new leads
      const { count: freshCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');
      setNewCount(freshCount || 0);

      const { data, count, error } = await query;
      if (error) throw error;
      setLeads(data || []);
      setTotal(count || 0);
    } catch (err) {
      console.error('Failed to fetch leads:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, source, showAll]);

  useEffect(() => {
    const t = setTimeout(fetchLeads, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  useEffect(() => { setPage(1); }, [search, source, showAll]);

  const filterStyle = {
    height: 38, background: 'var(--if-card)', border: '1px solid var(--if-border2)',
    borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, color: 'var(--if-text2)', cursor: 'pointer', outline: 'none', appearance: 'none',
  };

  const isDone = (s) => s === 'converted' || s === 'lost';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '0 12px', height: 38, minWidth: 220, maxWidth: 300 }}
            onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; }}
            onBlurCapture={(e)  => { e.currentTarget.style.borderColor = 'var(--if-border2)'; }}
          >
            <Search size={14} style={{ color: 'var(--if-muted)', flexShrink: 0 }} />
            <input type="text" placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', width: '100%' }}
            />
          </div>

          {/* Source filter */}
          <select value={source} onChange={(e) => setSource(e.target.value)} style={filterStyle}>
            {SOURCE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Show all toggle */}
          <button
            onClick={() => setShowAll((p) => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 38, padding: '0 14px', borderRadius: 8,
              border: `1px solid ${showAll ? 'var(--if-accent)' : 'var(--if-border2)'}`,
              background: showAll ? 'var(--if-accentbg2)' : 'var(--if-card)',
              fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600,
              color: showAll ? 'var(--if-accent)' : 'var(--if-text2)',
              cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
            }}
          >
            {/* Toggle indicator */}
            <div style={{
              width: 32, height: 18, borderRadius: 9,
              background: showAll ? 'var(--if-accent)' : 'var(--if-border2)',
              position: 'relative', transition: 'background .2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 2,
                left: showAll ? 16 : 2,
                width: 14, height: 14,
                borderRadius: '50%', background: '#fff',
                transition: 'left .2s',
                boxShadow: '0 1px 3px rgba(0,0,0,.3)',
              }} />
            </div>
            {showAll ? 'Show All' : 'Active Only'}
          </button>
        </div>

        <Button icon={<UserPlus size={15} />} onClick={() => setCreateOpen(true)}>Add Lead</Button>
      </div>

      {/* Hint text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -8 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>
          {showAll
            ? 'Showing active + lost leads (converted leads are removed from list)'
            : 'Showing active leads only — toggle to see lost leads as well'
          }
        </p>
        {newCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 10px', background: 'rgba(56,189,248,0.09)', border: '1px solid #38bdf8', borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>
              {newCount} uncontacted
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '60px 0' }}><PageSpinner /></div>
        : leads.length === 0 ? (
          <EmptyState icon={UserPlus}
            title={showAll ? 'No leads found' : 'No active leads'}
            message={showAll ? 'No leads match your filters.' : 'All leads are converted or lost. Toggle to see them.'}
            action={<Button onClick={() => setCreateOpen(true)}>Add Lead</Button>}
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--if-bg3)', borderBottom: '1px solid var(--if-border)' }}>
                    {['Name', 'Contact', 'Source', 'Status', 'Added', 'Action'].map((h) => (
                      <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)', padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => {
                    const done = isDone(lead.status);
                    const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ');
                    return (
                      <tr key={lead.id}
                        style={{
                          borderBottom: i < leads.length - 1 ? '1px solid var(--if-border)' : 'none',
                          cursor: 'pointer', transition: 'background .12s',
                          opacity: done ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--if-accentbg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => router.push(`/admin/crm/${lead.id}`)}
                      >
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <p style={{
                            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                            color: done ? 'var(--if-muted)' : 'var(--if-text)',
                            textDecoration: done ? 'line-through' : 'none',
                          }}>
                            {name}
                          </p>
                          {lead.status === 'converted' && lead.converted_member_id && (
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#22c55e', marginTop: 2 }}>
                              ✓ Member created
                            </p>
                          )}
                          {!done && lead.notes && (
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)', marginTop: 1, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {lead.notes}
                            </p>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {lead.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)' }}><Phone size={11} style={{ color: 'var(--if-muted)' }} />{lead.phone}</div>}
                            {lead.email && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)' }}><Mail size={11} style={{ color: 'var(--if-muted)' }} />{lead.email}</div>}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant="yellow" size="sm">{lead.source?.replace('_', ' ') || '—'}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant={STATUS_VARIANT[lead.status] || 'default'} size="sm">{lead.status}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)' }}>
                          {formatDateTime(lead.created_at)}
                        </td>
                        <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => router.push(`/admin/crm/${lead.id}`)}
                            style={{ height: 30, padding: '0 12px', borderRadius: 7, background: 'transparent', border: '1px solid var(--if-border2)', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, color: 'var(--if-text2)', cursor: 'pointer', transition: 'all .15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--if-border)', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>
                {total} lead{total !== 1 ? 's' : ''}
              </p>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </div>
          </>
        )}
      </div>

      <CreateLeadModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => { setCreateOpen(false); fetchLeads(); }} />
    </div>
  );
}
