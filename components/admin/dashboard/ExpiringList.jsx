import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

function ExpiryPill({ days }) {
  if (days <= 7)  return <span className="expiry-pill-urgent"  style={pillStyle('var(--if-red, #f4566a)',   'rgba(244,86,106,0.09)')} >{days}d</span>;
  if (days <= 14) return <span className="expiry-pill-soon"    style={pillStyle('#fb923c',                 'rgba(251,146,60,0.09)')} >{days}d</span>;
  return               <span className="expiry-pill-ok"       style={pillStyle('var(--if-green, #22d3a0)','rgba(34,211,160,0.09)')} >{days}d</span>;
}

function pillStyle(color, bg) {
  return {
    fontFamily:    "'Outfit', sans-serif",
    fontSize:      10,
    fontWeight:    700,
    padding:       '3px 9px',
    borderRadius:  20,
    background:    bg,
    color,
    flexShrink:    0,
  };
}

function initials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ExpiringList({ members = [] }) {
  return (
    <div
      style={{
        background:   'var(--if-card)',
        border:       '1px solid var(--if-border)',
        borderRadius: 12,
        overflow:     'hidden',
        display:      'flex',
        flexDirection:'column',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--if-border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="rounded-full"
            style={{ width: 8, height: 8, background: 'var(--if-red, #f4566a)' }}
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
            Expiring Soon
          </span>
        </div>
        <Link
          href="/admin/subscriptions?filter=expiring"
          className="flex items-center gap-1 transition-colors"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize:   12,
            fontWeight: 600,
            color:      'var(--if-accent)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          View All <ArrowRight size={13} />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {members.length === 0 ? (
          <div
            className="flex items-center justify-center py-10"
            style={{ color: 'var(--if-muted)', fontSize: 13 }}
          >
            No expiring memberships
          </div>
        ) : (
          members.map((m, i) => (
            <div
              key={m.id || i}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors duration-100 cursor-default"
              style={{ borderBottom: i < members.length - 1 ? '1px solid var(--if-border)' : 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Avatar */}
              <div
                className="flex items-center justify-center flex-shrink-0 rounded-lg"
                style={{
                  width:      30,
                  height:     30,
                  background: 'var(--if-card2, #1a1a2e)',
                  border:     '1px solid var(--if-border2)',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize:   10,
                  fontWeight: 700,
                  color:      'var(--if-text2)',
                }}
              >
                {initials(m.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="truncate"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize:   13,
                    fontWeight: 600,
                    color:      'var(--if-text)',
                    lineHeight: 1.2,
                  }}
                >
                  {m.name}
                </p>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize:   11,
                    color:      'var(--if-muted)',
                  }}
                >
                  {m.plan} · {m.date}
                </p>
              </div>

              <ExpiryPill days={m.daysLeft} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}