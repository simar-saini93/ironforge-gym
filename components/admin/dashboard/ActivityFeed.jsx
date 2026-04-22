import { LogIn, RefreshCw, UserPlus, ShieldX } from 'lucide-react';

const ACTIVITY_ICONS = {
  access_granted: { icon: LogIn,     bg: 'rgba(34,211,160,0.09)',  color: 'var(--if-green, #22d3a0)' },
  renewed:        { icon: RefreshCw, bg: 'rgba(99,102,241,0.12)',  color: 'var(--if-accent)'         },
  new_lead:       { icon: UserPlus,  bg: 'rgba(56,189,248,0.09)',  color: '#38bdf8'                  },
  access_denied:  { icon: ShieldX,   bg: 'rgba(244,86,106,0.09)',  color: 'var(--if-red, #f4566a)'   },
};

export default function ActivityFeed({ activities = [] }) {
  return (
    <div
      style={{
        background:    'var(--if-card)',
        border:        '1px solid var(--if-border)',
        borderRadius:  12,
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--if-border)' }}
      >
        <div
          className="rounded-full"
          style={{ width: 8, height: 8, background: '#38bdf8' }}
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
          Live Activity
        </span>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div
            className="flex items-center justify-center py-10"
            style={{ color: 'var(--if-muted)', fontSize: 13 }}
          >
            No recent activity
          </div>
        ) : (
          activities.map((a, i) => {
            const cfg  = ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.new_lead;
            const Icon = cfg.icon;

            return (
              <div
                key={a.id || i}
                className="flex gap-3 px-5 py-2.5 transition-colors duration-100 cursor-default"
                style={{ borderBottom: i < activities.length - 1 ? '1px solid var(--if-border)' : 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Icon */}
                <div
                  className="flex items-center justify-center flex-shrink-0 rounded-lg mt-0.5"
                  style={{ width: 30, height: 30, background: cfg.bg, color: cfg.color }}
                >
                  <Icon size={14} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize:   12.5,
                      fontWeight: 400,
                      color:      'var(--if-text2)',
                      lineHeight: 1.45,
                    }}
                    dangerouslySetInnerHTML={{ __html: a.message }}
                  />
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize:   11,
                      color:      'var(--if-muted)',
                      marginTop:  2,
                    }}
                  >
                    {a.time}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}