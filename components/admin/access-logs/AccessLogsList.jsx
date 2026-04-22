'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime, fullName } from '@/utils/format';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

const PAGE_SIZE = 25;

export default function AccessLogsList() {
  const router   = useRouter();
  const supabase = createClient();

  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [method,  setMethod]  = useState('');
  const [live,    setLive]    = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('access_logs')
        .select(`
          id, method, status, accessed_at, denied_reason, device_id,
          member:members(id, member_number, profile:profiles(first_name, last_name))
        `, { count: 'exact' })
        .order('accessed_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (status) query = query.eq('status', status);
      if (method) query = query.eq('method', method);

      const { data, count, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter((l) =>
          fullName(l.member?.profile).toLowerCase().includes(s) ||
          l.member?.member_number?.toLowerCase().includes(s)
        );
      }

      setLogs(filtered);
      setTotal(count || 0);
    } catch (err) {
      console.error('Failed to fetch access logs:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, method]);

  useEffect(() => {
    const t = setTimeout(fetchLogs, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  useEffect(() => { setPage(1); }, [search, status, method]);

  // Live refresh every 10s when enabled
  useEffect(() => {
    if (!live) return;
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [live, fetchLogs]);

  const filterStyle = { height: 38, background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text2)', cursor: 'pointer', outline: 'none', appearance: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '0 12px', height: 38, minWidth: 240 }}
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
            <option value="granted">Granted</option>
            <option value="denied">Denied</option>
          </select>
          <select value={method} onChange={(e) => setMethod(e.target.value)} style={filterStyle}>
            <option value="">All Methods</option>
            <option value="qr">QR Code</option>
            <option value="daily_code">Daily Code</option>
          </select>
        </div>

        {/* Live toggle */}
        <button
          onClick={() => setLive((p) => !p)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', borderRadius: 8, border: `1px solid ${live ? 'var(--if-accent)' : 'var(--if-border2)'}`, background: live ? 'var(--if-accentbg2)' : 'var(--if-card)', fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: live ? 'var(--if-accent)' : 'var(--if-text2)', cursor: 'pointer', transition: 'all .15s' }}
        >
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: live ? 'var(--if-accent)' : 'var(--if-muted)', animation: live ? 'pulse 1s infinite' : 'none' }} />
          {live ? 'Live' : 'Go Live'}
        </button>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

        <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={fetchLogs} loading={loading}>Refresh</Button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading && logs.length === 0 ? <div style={{ padding: '60px 0' }}><PageSpinner /></div>
        : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--if-bg3)', borderBottom: '1px solid var(--if-border)' }}>
                    {['Member', 'Date & Time', 'Method', 'Status', 'Reason', 'Device'].map((h) => (
                      <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)', padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--if-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>No access logs found</td></tr>
                  ) : (
                    logs.map((log, i) => {
                      const name = fullName(log.member?.profile);
                      const granted = log.status === 'granted';
                      return (
                        <tr key={log.id}
                          style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--if-border)' : 'none', cursor: 'pointer', transition: 'background .12s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--if-accentbg)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => log.member?.id && router.push(`/admin/members/${log.member.id}`)}
                        >
                          <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>{name}</p>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--if-muted)' }}>{log.member?.member_number}</p>
                          </td>
                          <td style={{ padding: '10px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--if-text2)', whiteSpace: 'nowrap' }}>{formatDateTime(log.accessed_at)}</td>
                          <td style={{ padding: '10px 16px' }}><Badge variant="yellow" size="sm">{log.method === 'qr' ? 'QR' : 'Daily Code'}</Badge></td>
                          <td style={{ padding: '10px 16px' }}><Badge variant={granted ? 'active' : 'expired'} size="sm">{log.status}</Badge></td>
                          <td style={{ padding: '10px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>{log.denied_reason || '—'}</td>
                          <td style={{ padding: '10px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--if-muted)' }}>{log.device_id || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--if-border)', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>
                {total} total entries
              </p>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
