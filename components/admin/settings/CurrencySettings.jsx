'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CURRENCIES, getCurrency } from '@/lib/currencies';
import Button from '@/components/ui/Button';

const S = {
  accent:   'var(--if-accent)', accentbg2: 'var(--if-accentbg2)',
  card:     'var(--if-card)',   card2: 'var(--if-card2)',
  bg3:      'var(--if-bg3)',    border: 'var(--if-border)', border2: 'var(--if-border2)',
  text:     'var(--if-text)',   text2: 'var(--if-text2)',   muted: 'var(--if-muted)',
  red:      'var(--if-red)',
};

export default function CurrencySettings() {
  const supabase  = useRef(createClient()).current;
  const [current,  setCurrent]  = useState('BZD');
  const [search,   setSearch]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    supabase.from('branches').select('currency').limit(1).single()
      .then(({ data }) => {
        if (data?.currency) setCurrent(data.currency);
        setLoading(false);
      });
  }, []);

  const filtered = CURRENCIES.filter((c) =>
    search.trim() === '' ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    setSaving(true);
    try {
      await supabase.from('branches').update({ currency: current }).eq('id', (await supabase.from('branches').select('id').limit(1).single()).data?.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const selectedCur = getCurrency(current);

  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: S.text, margin: 0 }}>Currency</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: S.muted, margin: '2px 0 0' }}>
            Used across all payments, receipts and invoices
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Current currency preview */}
          <div style={{ padding: '6px 12px', background: S.accentbg2, border: `1px solid ${S.accent}`, borderRadius: 8 }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: S.accent }}>
              {selectedCur.code} {selectedCur.symbol}
            </span>
          </div>
          <Button size="sm" loading={saving} onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save'}
          </Button>
        </div>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: S.bg3, border: `1px solid ${S.border2}`, borderRadius: 8, padding: '0 12px', height: 38, marginBottom: 12 }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = S.accent; }}
          onBlurCapture={(e)  => { e.currentTarget.style.borderColor = S.border2; }}
        >
          <Search size={14} style={{ color: S.muted, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search currency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.text, width: '100%' }}
          />
        </div>

        {/* Currency list */}
        <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((cur) => {
            const selected = cur.code === current;
            return (
              <button key={cur.code} onClick={() => setCurrent(cur.code)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: `1px solid ${selected ? S.accent : 'transparent'}`, background: selected ? S.accentbg2 : 'transparent', cursor: 'pointer', transition: 'all .12s', textAlign: 'left' }}
                onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = S.bg3; }}
                onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: selected ? S.accent : S.text2, minWidth: 36 }}>
                    {cur.code}
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: selected ? S.accent : S.text }}>
                    {cur.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: selected ? S.accent : S.muted }}>
                    {cur.symbol}
                  </span>
                  {selected && <Check size={14} style={{ color: S.accent }} />}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.muted, textAlign: 'center', padding: '20px 0' }}>
              No currencies match "{search}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
