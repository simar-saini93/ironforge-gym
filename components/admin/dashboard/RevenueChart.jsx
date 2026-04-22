'use client';

import { formatCurrency } from '@/utils/format';
const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

export default function RevenueChart({ data = [], currentMonth = 'Mar', total = formatCurrency(0) }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div
      style={{
        background:   'var(--if-card)',
        border:       '1px solid var(--if-border)',
        borderRadius: 12,
        overflow:     'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--if-border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="rounded-full"
            style={{ width: 8, height: 8, background: 'var(--if-green, #22d3a0)' }}
          />
          <span
            style={{
              fontFamily:    "'Outfit', sans-serif",
              fontSize:      14,
              fontWeight:    700,
              color:         'var(--if-text)',
              letterSpacing: '-.01em',
            }}
          >
            Monthly Revenue
          </span>
        </div>

        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{
            fontFamily: "'Outfit', sans-serif",
            background: 'rgba(34,211,160,0.09)',
            color:      'var(--if-green, #22d3a0)',
          }}
        >
          ↑ 8.4% vs last
        </span>
      </div>

      {/* Chart body */}
      <div className="px-5 pt-4 pb-5">
        {/* Total */}
        <p
          className="mb-1 leading-none"
          style={{
            fontFamily:    "'Outfit', sans-serif",
            fontSize:      26,
            fontWeight:    800,
            letterSpacing: '-.03em',
            color:         'var(--if-text)',
          }}
        >
          {total}
        </p>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize:   12,
            color:      'var(--if-muted)',
            marginBottom: 16,
          }}
        >
          {currentMonth} 2026 · highest this year
        </p>

        {/* Bars */}
        <div className="flex items-end gap-2" style={{ height: 80 }}>
          {(data.length ? data : MONTHS.map((m, i) => ({ label: m, value: 40 + i * 12 }))).map(
            (item) => {
              const pct     = (item.value / max) * 100;
              const isCurrent = item.label === currentMonth;

              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1.5 flex-1"
                  style={{ height: '100%', justifyContent: 'flex-end' }}
                >
                  <div
                    className="w-full rounded-t-sm transition-all duration-300 cursor-pointer"
                    style={{
                      height:     `${pct}%`,
                      minHeight:  4,
                      background: isCurrent
                        ? 'var(--if-accent)'
                        : 'var(--if-border2, #26263c)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.filter = 'brightness(1.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'none';
                    }}
                  />
                  <span
                    style={{
                      fontFamily:    "'Outfit', sans-serif",
                      fontSize:      9,
                      fontWeight:    600,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: isCurrent
                        ? 'var(--if-accent)'
                        : 'var(--if-muted)',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
