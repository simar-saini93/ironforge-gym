import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

function Badge({ status }) {
  const styles = {
    present: { bg: 'rgba(34,211,160,0.09)',  color: 'var(--if-green, #22d3a0)', label: 'Present'  },
    absent:  { bg: 'rgba(244,86,106,0.09)',  color: 'var(--if-red, #f4566a)',   label: 'Absent'   },
    leave:   { bg: 'rgba(251,146,60,0.09)',  color: '#fb923c',                  label: 'On Leave' },
  };
  const s = styles[status] || styles.absent;
  return (
    <span
      style={{
        fontFamily:  "'Outfit', sans-serif",
        fontSize:    10,
        fontWeight:  700,
        padding:     '3px 9px',
        borderRadius: 20,
        background:  s.bg,
        color:       s.color,
        flexShrink:  0,
        letterSpacing: '.05em',
        textTransform: 'uppercase',
      }}
    >
      {s.label}
    </span>
  );
}

function ProgressBar({ value, warn = false }) {
  return (
    <div
      style={{
        width:        80,
        height:       5,
        background:   'var(--if-bg3, #111120)',
        borderRadius: 10,
        overflow:     'hidden',
        flexShrink:   0,
      }}
    >
      <div
        style={{
          width:        `${value}%`,
          height:       '100%',
          borderRadius: 10,
          background:   warn ? '#fb923c' : 'var(--if-accent)',
          transition:   'width 0.4s ease',
        }}
      />
    </div>
  );
}

function initials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function TrainerAttendanceWidget({ trainers = [] }) {
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
            style={{ width: 8, height: 8, background: '#c084fc' }}
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
            Trainer Attendance
          </span>
        </div>
        <Link
          href="/admin/trainers?tab=attendance"
          className="flex items-center gap-1 transition-opacity hover:opacity-75"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize:   12,
            fontWeight: 600,
            color:      'var(--if-accent)',
          }}
        >
          Mark Today <ArrowRight size={13} />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--if-bg3, #111120)' }}>
              {['Trainer', 'Today', 'Week', 'Rate'].map((h) => (
                <th
                  key={h}
                  style={{
                    fontFamily:    "'Outfit', sans-serif",
                    fontSize:      10,
                    fontWeight:    700,
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    color:         'var(--if-muted)',
                    padding:       '9px 16px',
                    textAlign:     'left',
                    whiteSpace:    'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trainers.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding:   '24px 16px',
                    textAlign: 'center',
                    fontSize:  13,
                    color:     'var(--if-muted)',
                  }}
                >
                  No trainers found
                </td>
              </tr>
            ) : (
              trainers.map((t, i) => {
                const rate = Math.round((t.present / t.total) * 100);
                const warn = rate < 70;

                return (
                  <tr
                    key={t.id || i}
                    style={{ borderBottom: i < trainers.length - 1 ? '1px solid var(--if-border)' : 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Name */}
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                      <div className="flex items-center gap-2.5">
                        <div
                          style={{
                            width:        32,
                            height:       32,
                            borderRadius: 8,
                            background:   'var(--if-card2, #1a1a2e)',
                            border:       '1px solid var(--if-border2)',
                            display:      'flex',
                            alignItems:   'center',
                            justifyContent: 'center',
                            fontFamily:   "'Outfit', sans-serif",
                            fontSize:     11,
                            fontWeight:   700,
                            color:        'var(--if-accent)',
                            flexShrink:   0,
                          }}
                        >
                          {initials(t.name)}
                        </div>
                        <span
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize:   13,
                            fontWeight: 600,
                            color:      'var(--if-text)',
                          }}
                        >
                          {t.name}
                        </span>
                      </div>
                    </td>

                    {/* Today status */}
                    <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                      <Badge status={t.todayStatus} />
                    </td>

                    {/* Week */}
                    <td
                      style={{
                        padding:    '11px 16px',
                        fontFamily: "'Outfit', sans-serif",
                        fontSize:   14,
                        fontWeight: 700,
                        color:      'var(--if-text)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.present}/{t.total}
                    </td>

                    {/* Rate bar */}
                    <td style={{ padding: '11px 16px' }}>
                      <ProgressBar value={rate} warn={warn} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}