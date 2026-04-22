'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m}${hr >= 12 ? 'PM' : 'AM'}`;
}

export default function GymStatusBar({ accentColor = '#E8FF00' }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch('/api/schedule')
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {});
  }, []);

  if (!status) return null;

  const { today } = status;
  const now = new Date();
  const dayLabel = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  if (today.is_closed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.05em', color: '#888', whiteSpace: 'nowrap' }}>
          {dayLabel}
        </span>
        <span style={{ color: '#444', fontSize: 10 }}>·</span>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#ef4444', whiteSpace: 'nowrap' }}>
          Gym Closed
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.05em', color: '#888', whiteSpace: 'nowrap' }}>
        {dayLabel}
      </span>
      <span style={{ color: '#444', fontSize: 10 }}>·</span>
      <Clock size={11} style={{ color: accentColor, flexShrink: 0 }} />
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.05em', color: accentColor, whiteSpace: 'nowrap' }}>
        {fmtTime(today.timings?.open)} – {fmtTime(today.timings?.close)}
      </span>
    </div>
  );
}
