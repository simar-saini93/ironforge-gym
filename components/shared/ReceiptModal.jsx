'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Printer } from 'lucide-react';

function fmtCurrency(n) {
  return Number(n).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtMethod(m) {
  return (m || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// role: 'admin' | 'member' — determines which API endpoint to use
export default function ReceiptModal({ paymentId, open, onClose, role = 'admin' }) {
  const printRef = useRef(null);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [branch,  setBranch]  = useState(null);

  useEffect(() => {
    if (!open || !paymentId) return;
    setLoading(true);

    // ── Use role-appropriate endpoint ─────────────────────────
    const paymentEndpoint = role === 'member'
      ? `/api/member/payments/${paymentId}`
      : `/api/admin/payments/${paymentId}`;

    Promise.all([
      fetch(paymentEndpoint).then((r) => r.json()),
      fetch('/api/branch').then((r) => r.json()),
    ]).then(([payJson, branchJson]) => {
      setData(payJson.payment);
      setBranch(branchJson.branch);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open, paymentId, role]);

  function handlePrint() {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Receipt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #000; padding: 40px; }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: 3px; margin-bottom: 8px; }
    .logo span { color: #E8FF00; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .divider { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .label { color: #666; }
    .value { font-weight: 600; }
    .amount-row { display: flex; justify-content: space-between; padding: 14px 0 0; font-size: 20px; font-weight: 900; }
    .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
    @media print { @page { margin: 20mm; } }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  }

  if (!open) return null;

  const member    = data?.member?.profile;
  const sub       = data?.subscription;
  const plan      = sub?.plan;
  const receiptNo = data?.id?.slice(-8).toUpperCase();

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: 480, background: 'var(--if-card, #111)', border: '1px solid var(--if-border, #1f1f1f)', borderRadius: 14, zIndex: 201, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--if-border, #1f1f1f)', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--if-text, #f0f0f0)' }}>Payment Receipt</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', borderRadius: 7, border: '1px solid var(--if-border2, #2a2a2a)', background: 'transparent', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, color: 'var(--if-accent, #F5C518)', cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent, #F5C518)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2, #2a2a2a)'; }}
            >
              <Printer size={12} /> Print
            </button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid var(--if-border2, #2a2a2a)', background: 'transparent', cursor: 'pointer', color: 'var(--if-text2, #888)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 18px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--if-muted, #444)', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Loading receipt...</div>
          ) : !data ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--if-muted, #444)', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Receipt not found.</div>
          ) : (
            <div ref={printRef}>
              <div className="logo" style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 3, color: 'var(--if-text, #f0f0f0)', marginBottom: 4 }}>
                IRON<span style={{ color: 'var(--if-accent, #F5C518)' }}>FORGE</span>
              </div>
              {branch && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted, #666)', marginBottom: 20 }}>
                  {branch.name}{branch.address ? ` · ${branch.address}` : ''}
                </p>
              )}
              <div style={{ padding: '12px 14px', background: 'var(--if-accentbg2, rgba(245,197,24,0.08))', border: '1px solid var(--if-accent, #F5C518)', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-accent, #F5C518)', margin: 0 }}>Official Receipt</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--if-text, #f0f0f0)', margin: '4px 0 0' }}>#{receiptNo}</p>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2, #888)', margin: 0 }}>{fmtDate(data.payment_date || data.created_at)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  ['Member Name',    `${member?.first_name || ''} ${member?.last_name || ''}`.trim()],
                  ['Member ID',      data.member?.member_number || '—'],
                  ['Plan',           (plan?.billing_cycle || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'],
                  ['Valid From',     fmtDate(sub?.start_date)],
                  ['Valid Until',    fmtDate(sub?.end_date)],
                  ['Payment Method', fmtMethod(data.payment_method)],
                  ...(data.reference_no ? [['Reference No.', data.reference_no]] : []),
                  ...(data.notes       ? [['Notes',         data.notes]]         : []),
                ].map(([label, value]) => (
                  <div key={label} className="row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--if-border, #1f1f1f)' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-text2, #888)' }}>{label}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text, #f0f0f0)' }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 4 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--if-text2, #888)' }}>Amount Paid</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 900, color: 'var(--if-accent, #F5C518)' }}>{fmtCurrency(data.amount)}</span>
                </div>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted, #444)', marginTop: 20, textAlign: 'center', lineHeight: 1.6 }}>
                This is an official receipt from {branch?.name || 'IronForge Gym'}.<br />Keep this for your records.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
