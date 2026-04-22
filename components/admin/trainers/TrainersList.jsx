'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, Eye, Edit, CheckCircle2, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, fullName, initials } from '@/utils/format';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';

const PAGE_SIZE = 15;

function Avatar({ name, size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: 'var(--if-accentbg2)', border: '1px solid var(--if-border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: size * 0.34, fontWeight: 700, color: 'var(--if-accent)', flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

export default function TrainersList() {
  const router   = useRouter();
  const supabase = createClient();

  const [trainers, setTrainers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchTrainers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('trainers')
        .select(`
          id, is_active, specialization,
          profile:profiles(first_name, last_name, email, phone),
          assignments:member_trainer_assignments(id, is_active)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter((t) =>
          fullName(t.profile).toLowerCase().includes(s) ||
          t.profile?.email?.toLowerCase().includes(s)
        );
      }

      setTrainers(filtered);
      setTotal(count || 0);
    } catch (err) {
      console.error('Failed to fetch trainers:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchTrainers, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchTrainers]);

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '0 12px', height: 38, minWidth: 260 }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; }}
          onBlurCapture={(e)  => { e.currentTarget.style.borderColor = 'var(--if-border2)'; }}
        >
          <Search size={14} style={{ color: 'var(--if-muted)', flexShrink: 0 }} />
          <input type="text" placeholder="Search trainers..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', width: '100%' }}
          />
        </div>
        <Button icon={<UserPlus size={15} />} onClick={() => router.push('/admin/trainers/new')}>Add Trainer</Button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 0' }}><PageSpinner /></div>
        ) : trainers.length === 0 ? (
          <EmptyState icon={UserPlus} title="No trainers found" message="Add your first trainer to get started."
            action={<Button icon={<UserPlus size={15} />} onClick={() => router.push('/admin/trainers/new')}>Add Trainer</Button>}
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--if-bg3)', borderBottom: '1px solid var(--if-border)' }}>
                    {['Trainer', 'Specialization', 'Members', 'Hire Date', 'Status', 'Actions'].map((h) => (
                      <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)', padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trainers.map((trainer, i) => {
                    const name           = fullName(trainer.profile);
                    const activeMembers  = trainer.assignments?.filter((a) => a.is_active).length || 0;
                    return (
                      <tr key={trainer.id}
                        style={{ borderBottom: i < trainers.length - 1 ? '1px solid var(--if-border)' : 'none', cursor: 'pointer', transition: 'background .12s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--if-accentbg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => router.push(`/admin/trainers/${trainer.id}`)}
                      >
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={name} />
                            <div>
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)', lineHeight: 1.3 }}>{name}</p>
                              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)' }}>{trainer.profile?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text2)' }}>{trainer.specialization || '—'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--if-text)' }}>{activeMembers}</span>
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text2)' }}>{formatDate(trainer.created_at)}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant={trainer.is_active ? 'active' : 'expired'}>{trainer.is_active ? 'Active' : 'Inactive'}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {[{ icon: Eye, href: `/admin/trainers/${trainer.id}` }, { icon: Edit, href: `/admin/trainers/${trainer.id}/edit` }].map(({ icon: Icon, href }) => (
                              <button key={href} onClick={() => router.push(href)}
                                style={{ width: 30, height: 30, borderRadius: 7, background: 'transparent', border: '1px solid var(--if-border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--if-text2)', cursor: 'pointer', transition: 'all .15s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
                              >
                                <Icon size={13} />
                              </button>
                            ))}
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
                {total} trainer{total !== 1 ? 's' : ''}
              </p>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
