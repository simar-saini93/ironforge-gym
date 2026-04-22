'use client';

import { useState, useEffect } from 'react';
import { createClient }        from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/utils/format';
import Badge        from '@/components/ui/Badge';
import ReceiptModal from '@/components/shared/ReceiptModal';

const M = {
  accent: '#E8FF00', accentbg2: 'rgba(232,255,0,0.14)',
  card: '#111111', border: '#1f1f1f', border2: '#2a2a2a',
  text: '#f0f0f0', text2: '#888888', muted: '#444444',
  green: '#22c55e',
};

export default function MemberPayments() {
  const supabase = createClient();
  const [payments,  setPayments]  = useState([]);
  const [receiptId, setReceiptId] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: member }   = await supabase.from('members').select('id').eq('profile_id', user.id).single();
      if (!member) { setLoading(false); return; }
      const { data } = await supabase
        .from('payments')
        .select('id, amount, payment_method, payment_date, reference_no')
        .eq('member_id', member.id)
        .order('payment_date', { ascending: false });
      setPayments(data || []);
      setTotal((data || []).reduce((s, p) => s + Number(p.amount), 0));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: M.text2 }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color: M.text }}>Payment History</h2>
        <div style={{ background: M.accentbg2, border: `1px solid ${M.accent}`, borderRadius: 10, padding: '8px 18px', textAlign: 'right' }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: M.accent }}>Total Paid</p>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1, color: M.accent }}>{formatCurrency(total)}</p>
        </div>
      </div>

      {/* List */}
      {payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: M.text2, fontFamily: "'Barlow', sans-serif", fontSize: 14 }}>
          No payment records yet.
        </div>
      ) : (
        <div style={{ background: M.card, border: `1px solid ${M.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {payments.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < payments.length - 1 ? `1px solid ${M.border}` : 'none', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 600, color: M.text }}>{formatDate(p.payment_date)}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Badge variant="yellow" size="sm">{p.payment_method?.replace('_', ' ')}</Badge>
                  {p.reference_no && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: M.muted }}>{p.reference_no}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1, color: M.green }}>
                  {formatCurrency(p.amount)}
                </span>
                <button onClick={() => setReceiptId(p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 12px', borderRadius: 7, border: `1px solid ${M.border2}`, background: 'transparent', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.05em', color: M.accent, cursor: 'pointer', transition: 'all .15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = M.accentbg2)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  🧾 Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReceiptModal paymentId={receiptId} open={!!receiptId} onClose={() => setReceiptId(null)} />
    </div>
  );
}
