import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StatCard
 * @param {string}    title
 * @param {string}    value
 * @param {ReactNode} icon      — Lucide icon component
 * @param {string}    iconColor — CSS color string
 * @param {string}    trend     — 'up' | 'down' | 'warn'
 * @param {string}    trendText
 */
export default function StatCard({ title, value, icon: Icon, iconColor, trend, trendText }) {
  const trendStyles = {
    up:   { bg: 'rgba(34,211,160,0.09)',  color: 'var(--if-green, #22d3a0)' },
    down: { bg: 'rgba(244,86,106,0.09)',  color: 'var(--if-red, #f4566a)'  },
    warn: { bg: 'rgba(251,146,60,0.09)',  color: '#fb923c'                  },
  };

  const ts = trendStyles[trend] || trendStyles.up;

  return (
    <div
      className="relative overflow-hidden transition-all duration-200 group"
      style={{
        background:   'var(--if-card)',
        border:       '1px solid var(--if-border)',
        borderRadius: 12,
        padding:      '18px 20px',
        cursor:       'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform  = 'translateY(-2px)';
        e.currentTarget.style.boxShadow  = '0 8px 28px rgba(0,0,0,.14)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform  = 'none';
        e.currentTarget.style.boxShadow  = 'none';
      }}
    >
      {/* Bottom accent line on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ height: 2, background: iconColor, borderRadius: '0 0 12px 12px' }}
      />

      {/* Top row — icon + trend badge */}
      <div className="flex items-center justify-between mb-4">
        <div style={{ color: iconColor }}>
          {Icon && <Icon size={22} />}
        </div>

        {trend && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              background:    ts.bg,
              color:         ts.color,
              fontFamily:    "'Outfit', sans-serif",
              fontSize:      11,
              fontWeight:    600,
            }}
          >
            {trend === 'up'   && <TrendingUp   size={11} />}
            {trend === 'down' && <TrendingDown  size={11} />}
            <span>{trendText}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <p
        className="leading-none mb-1"
        style={{
          fontFamily:    "'Outfit', sans-serif",
          fontSize:      34,
          fontWeight:    800,
          letterSpacing: '-.03em',
          color:         'var(--if-text)',
        }}
      >
        {value}
      </p>

      {/* Title */}
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize:   13,
          fontWeight: 400,
          color:      'var(--if-text2)',
        }}
      >
        {title}
      </p>
    </div>
  );
}