'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function HolidayRibbon() {
  const [alert,     setAlert]     = useState(null);
  const [dismissed, setDismissed] = useState(null); // stores dismissed date string

  function checkSchedule() {
    fetch('/api/schedule')
      .then((r) => r.json())
      .then((d) => {
        const { today, tomorrow, holidays } = d;

        // Recalculate today string fresh every check
        const todayStr = new Date().toISOString().split('T')[0];
        const in7      = new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0];

        // Priority 1 — gym closed TODAY
        if (today.is_closed) {
          setAlert({
            urgency: 'today',
            key:     `today-${todayStr}`,
            message: today.holiday
              ? `Gym is closed today — ${today.holiday.title}`
              : 'Gym is closed today',
          });
          return;
        }

        // Priority 2 — gym closed TOMORROW
        if (tomorrow?.is_closed) {
          setAlert({
            urgency: 'tomorrow',
            key:     `tomorrow-${tomorrow.date}`,
            message: tomorrow.reason
              ? `Gym closed tomorrow — ${tomorrow.reason}`
              : 'Gym will be closed tomorrow',
          });
          return;
        }

        // Priority 3 — holiday within 7 days
        const upcoming = (holidays || [])
          .filter((h) => h.date > todayStr && h.date <= in7)
          .sort((a, b) => a.date.localeCompare(b.date));

        if (upcoming.length > 0) {
          const h       = upcoming[0];
          const days    = Math.ceil((new Date(h.date + 'T00:00:00') - new Date()) / 864e5);
          const dateLabel = new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
          setAlert({
            urgency: 'upcoming',
            key:     `upcoming-${h.date}`,
            message: `Gym closed ${days === 1 ? 'tomorrow' : `on ${dateLabel}`} — ${h.title}`,
          });
          return;
        }

        // No alert needed
        setAlert(null);
      })
      .catch(() => {});
  }

  // Check on mount + re-check at exact midnight
  useEffect(() => {
    checkSchedule();

    // Calculate ms until next midnight
    function msUntilMidnight() {
      const now  = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0); // next midnight
      return next.getTime() - now.getTime();
    }

    // At midnight — clear dismissed + re-check
    const timeout = setTimeout(() => {
      setDismissed(null);
      checkSchedule();
    }, msUntilMidnight());

    return () => clearTimeout(timeout);
  }, []);

  // Auto-clear dismissed state when alert key changes (date changed)
  const isDismissed = dismissed && alert && dismissed === alert.key;

  if (!alert || isDismissed) return null;

  const colors = {
    today:    { bg: 'rgba(239,68,68,0.12)',  border: '#ef4444', text: '#ef4444' },
    tomorrow: { bg: 'rgba(249,115,22,0.10)', border: '#f97316', text: '#f97316' },
    upcoming: { bg: 'rgba(249,115,22,0.08)', border: '#f97316', text: '#f97316' },
  };
  const col = colors[alert.urgency];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '10px 16px',
      background: col.bg, border: `1px solid ${col.border}`,
      borderRadius: 10, marginBottom: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={14} style={{ color: col.text, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: col.text }}>
          {alert.message}
        </span>
      </div>
      <button onClick={() => setDismissed(alert.key)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: col.text, padding: 0, opacity: .7, flexShrink: 0 }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '.7')}
      >
        <X size={13} />
      </button>
    </div>
  );
}
