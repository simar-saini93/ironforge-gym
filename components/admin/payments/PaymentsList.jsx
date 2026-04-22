'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency, fullName } from '@/utils/format';
import Badge        from '@/components/ui/Badge';
import Pagination   from '@/components/ui/Pagination';
import EmptyState   from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import ReceiptModal from '@/components/shared/ReceiptModal';

const PAGE_SIZE = 20;

export default function PaymentsList() {
  const supabase = createClient();

  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [method,    setMethod]    = useState('');
  const [summary,   setSummary]   = useState({ total: 0, count: 0 });
  const [receiptId, setReceiptId] = useState(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payments')
        .select(`
          id, amount, payment_method, payment_date, reference_no, notes,
          member:members(member_number, profile:profiles(first_name, last_name, email))
        `, { count: 'exact' })
        .order('payment_date', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (method) query = query.eq('payment_method', method);

      const { data, count, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter((p) =>
          fullName(p.member?.profile).toLowerCase().includes(s) ||
          p.member?.member_number?.toLowerCase().includes(s) ||
          p.reference_no?.toLowerCase().includes(s)
        );
      }

      setPayments(filtered);
      setTotal(count || 0);
      setSummary({ total: (data || []).reduce((sum, p) => sum + Number(p.amount), 0), count: count || 0 });
    } catch (err) {
      console.error('Failed to fetch payments:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, method]);

  useEffect(() => {
    const t = setTimeout(fetchPayments, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchPayments]);

  useEffect(() => { setPage(1); }, [search, method]);

  const filterStyle = {
    height: 38, background: 'var(--if-card)', border: '1px solid var(--if-border2)',
    borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, color: 'var(--if-text2)', cursor: 'pointer', outline: 'none', appearance: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Payments', value: summary.count,                                                           color: 'var(--if-accent)' },
          { label: 'Total Revenue',  value: formatCurrency(summary.total),                                           color: '#22c55e'          },
          { label: 'Avg per Payment',value: summary.count > 0 ? formatCurrency(summary.total / summary.count) : '—', color: '#38bdf8'          },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-.02em', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)', marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8, padding: '0 12px', height: 38, flex: 1, minWidth: 220 }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; }}
          onBlurCapture={(e)  => { e.currentTarget.style.borderColor = 'var(--if-border2)'; }}
        >
          <Search size={14} style={{ color: 'var(--if-muted)', flexShrink: 0 }} />
          <input type="text" placeholder="Search by member, reference..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', width: '100%' }}
          />
        </div>
        <select value={method} onChange={(e) => setMethod(e.target.value)} style={filterStyle}>
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--if-card)', border: '1px solid var(--if-border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 0' }}><PageSpinner /></div>
        ) : payments.length === 0 ? (
          <EmptyState icon={Search} title="No payments found" message="No payment records match your filters." />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--if-bg3)', borderBottom: '1px solid var(--if-border)' }}>
                    {['Member', 'Amount', 'Method', 'Date', 'Reference', 'Notes', ''].map((h) => (
                      <th key={h} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--if-muted)', padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.id}
                      style={{ borderBottom: i < payments.length - 1 ? '1px solid var(--if-border)' : 'none', transition: 'background .12s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--if-accentbg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)' }}>{fullName(p.member?.profile)}</p>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--if-muted)' }}>{p.member?.member_number}</p>
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, color: '#22c55e' }}>{formatCurrency(p.amount)}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant="yellow" size="sm">{p.payment_method?.replace('_', ' ')}</Badge>
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2)' }}>
                        {formatDate(p.payment_date)}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--if-muted)' }}>
                        {p.reference_no || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.notes || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => setReceiptId(p.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--if-border2)', background: 'transparent', fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, color: 'var(--if-accent)', cursor: 'pointer', transition: 'all .15s', letterSpacing: '.05em', whiteSpace: 'nowrap' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; }}
                        >
                          🧾 Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--if-border)', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>
                Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} payments
              </p>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </div>
          </>
        )}
      </div>

      <ReceiptModal paymentId={receiptId} open={!!receiptId} onClose={() => setReceiptId(null)} />
    </div>
  );
}