'use client';

import { useState, useEffect } from 'react';
import { Clock, CalendarDays, AlertTriangle, Dumbbell, X } from 'lucide-react';

const M = {
  accent: '#E8FF00', accentbg2: 'rgba(232,255,0,0.1)',
  card: '#111111', card2: '#1a1a1a', border: '#1f1f1f', border2: '#2a2a2a',
  text: '#f0f0f0', text2: '#888888', muted: '#444444',
  red: '#ef4444', redbg: 'rgba(239,68,68,0.09)',
  green: '#22c55e', greenbg: 'rgba(34,197,94,0.09)',
  orange: '#f97316', orangebg: 'rgba(249,115,22,0.09)',
};

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export default function MemberScheduleWidget() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/schedule')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) return null;

  const { today, tomorrow, gym, holidays } = data;
  const showAlert = !dismissed && tomorrow?.is_closed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Tomorrow closure alert banner ── */}
      {showAlert && (
        <div style={{
          background: M.orangebg, border: `1px solid ${M.orange}`,
          borderRadius: 12, padding: '14px 16px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertTriangle size={16} style={{ color: M.orange, flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: 1, color: M.orange, margin: 0 }}>
                Gym Closed Tomorrow
              </p>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: M.text2, margin: '3px 0 0' }}>
                {tomorrow.reason || 'Gym will be closed tomorrow'} · {fmtDate(tomorrow.date)}
              </p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: M.muted, padding: 0, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = M.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = M.muted)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Today's gym status ── */}
      <div style={{ background: M.card, border: `1px solid ${M.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: `1px solid ${M.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={14} style={{ color: M.accent }} />
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1, color: M.text }}>Today's Schedule</span>
        </div>

        <div style={{ padding: '16px 18px' }}>
          {today.is_closed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: M.redbg, border: `1px solid ${M.red}`, borderRadius: 10 }}>
              <AlertTriangle size={16} style={{ color: M.red }} />
              <div>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: M.red, margin: 0 }}>
                  Gym Closed Today
                </p>
                {today.holiday && (
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: M.text2, margin: '2px 0 0' }}>
                    {today.holiday.title}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Timings */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: M.greenbg, border: `1px solid ${M.green}`, borderRadius: 10 }}>
                <Clock size={14} style={{ color: M.green }} />
                <div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: M.green, margin: 0 }}>Open Today</p>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 1, color: M.text, margin: '2px 0 0' }}>
                    {fmtTime(today.timings?.open)} — {fmtTime(today.timings?.close)}
                  </p>
                </div>
              </div>

              {/* Trainers on duty */}
              {today.trainers?.length > 0 && (
                <div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: M.text2, marginBottom: 8 }}>
                    Trainers on Duty
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {today.trainers.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: M.card2, border: `1px solid ${M.border}`, borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: M.accentbg2, border: `1px solid ${M.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, color: M.accent, flexShrink: 0 }}>
                            {t.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: M.text, margin: 0 }}>{t.name}</p>
                            {t.specialization && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: M.text2, margin: 0 }}>{t.specialization}</p>}
                          </div>
                        </div>
                        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: M.text2 }}>
                          {t.is_full_day ? 'Full Day' : `${fmtTime(t.shift_start)}–${fmtTime(t.shift_end)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {today.trainers?.length === 0 && (
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: M.muted, margin: 0 }}>
                  No trainer duty assigned for today.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming holidays ── */}
      {holidays?.length > 0 && (
        <div style={{ background: M.card, border: `1px solid ${M.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: `1px solid ${M.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} style={{ color: M.orange }} />
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1, color: M.text }}>Upcoming Holidays</span>
          </div>
          <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {holidays.slice(0, 3).map((h) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: M.redbg, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 8 }}>
                <div>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: M.text, margin: 0 }}>{h.title}</p>
                  {h.reason && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: M.text2, margin: '2px 0 0' }}>{h.reason}</p>}
                </div>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: M.red, whiteSpace: 'nowrap', marginLeft: 12 }}>
                  {new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
