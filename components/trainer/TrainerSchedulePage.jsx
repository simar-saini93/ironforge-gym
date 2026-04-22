'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Clock, CheckCircle2, XCircle, AlertTriangle, Dumbbell, Users } from 'lucide-react';

const T = {
  accent: '#22c55e', accentbg2: 'rgba(34,197,94,0.14)',
  card: '#111111', card2: '#1a1a1a', border: '#1f1f1f', border2: '#2a2a2a',
  text: '#f0f0f0', text2: '#888888', muted: '#444444',
  red: '#ef4444', redbg: 'rgba(239,68,68,0.09)',
  orange: '#f97316', orangebg: 'rgba(249,115,22,0.09)',
};

const DAYS_S   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function SectionHeader({ title, icon: Icon, color = T.accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <Icon size={15} style={{ color }} />
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 1, color: T.text }}>{title}</span>
    </div>
  );
}

export default function TrainerSchedulePage() {
  const [duty,     setDuty]     = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('my_duty'); // 'my_duty' | 'all_trainers' | 'holidays'

  useEffect(() => {
    Promise.all([
      fetch('/api/schedule/trainer').then((r) => r.json()),
      fetch('/api/schedule').then((r) => r.json()),
    ]).then(([d, s]) => { setDuty(d); setSchedule(s); setLoading(false); })
     .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: T.muted, fontFamily: "'Barlow', sans-serif", fontSize: 13 }}>
      Loading schedule...
    </div>
  );

  const today    = new Date().toISOString().split('T')[0];
  const upcoming = duty?.upcoming || [];
  const gym      = schedule?.gym || {};
  const holidays = schedule?.holidays || [];
  const dutyByDate = schedule?.duty_by_date || {};
  const weeklyOffs = gym.weekly_off_days || [];

  // Group my duty by week
  const groupedDuty = upcoming.reduce((acc, d) => {
    const date  = new Date(d.date + 'T00:00:00');
    const week  = `Week of ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
    if (!acc[week]) acc[week] = [];
    acc[week].push(d);
    return acc;
  }, {});

  // Next 7 days for all trainers view
  const next14 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr  = d.toISOString().split('T')[0];
    const dayName  = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isOff    = weeklyOffs.includes(dayName);
    const holiday  = holidays.find((h) => h.date === dateStr);
    const isClosed = isOff || !!holiday;
    const trainers = dutyByDate[dateStr] || [];
    return { date: dateStr, day: d, isClosed, holiday, isOff, trainers };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 6 }}>
        {[
          { id: 'my_duty',      label: 'My Duty',       icon: Dumbbell     },
          { id: 'all_trainers', label: 'All Trainers',   icon: Users        },
          { id: 'holidays',     label: 'Holidays',       icon: AlertTriangle},
        ].map((t) => {
          const Icon = t.icon;
          const on   = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: on ? T.accent : 'transparent', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '.05em', color: on ? '#000' : T.text2, transition: 'all .15s' }}
            >
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── MY DUTY ── */}
      {tab === 'my_duty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {upcoming.length === 0 ? (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '40px 0', textAlign: 'center', color: T.muted, fontFamily: "'Barlow', sans-serif", fontSize: 13 }}>
              No upcoming duty assigned.
            </div>
          ) : (
            Object.entries(groupedDuty).map(([week, entries]) => (
              <div key={week}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: T.accent, marginBottom: 8 }}>
                  {week}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {entries.map((d) => {
                    const date    = new Date(d.date + 'T00:00:00');
                    const isToday = d.date === today;
                    return (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: isToday ? T.accentbg2 : T.card, border: `1px solid ${isToday ? T.accent : T.border}`, borderRadius: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ textAlign: 'center', minWidth: 40 }}>
                            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: isToday ? T.accent : T.muted, margin: 0 }}>
                              {DAYS_S[date.getDay()]}
                            </p>
                            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 1, color: isToday ? T.accent : T.text, lineHeight: 1, margin: 0 }}>
                              {date.getDate()}
                            </p>
                            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 10, color: T.muted, margin: 0 }}>
                              {MONTHS[date.getMonth()]}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>
                              {d.is_full_day ? 'Full Day Duty' : 'Shift Duty'}
                            </p>
                            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.text2, margin: '2px 0 0' }}>
                              {d.is_full_day ? `${fmtTime(schedule?.gym?.default_open || '06:00')} – ${fmtTime(schedule?.gym?.default_close || '22:00')}` : `${fmtTime(d.shift_start)} – ${fmtTime(d.shift_end)}`}
                            </p>
                          </div>
                        </div>
                        {isToday && (
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: T.accent, background: T.accentbg2, border: `1px solid ${T.accent}`, borderRadius: 20, padding: '3px 10px' }}>
                            TODAY
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ALL TRAINERS ── */}
      {tab === 'all_trainers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {next14.map(({ date, day, isClosed, holiday, trainers }) => {
            const isToday = date === today;
            return (
              <div key={date} style={{ background: isClosed ? T.redbg : T.card, border: `1px solid ${isClosed ? T.red : isToday ? T.accent : T.border}`, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: trainers.length > 0 ? 10 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'center', minWidth: 36 }}>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: isClosed ? T.red : isToday ? T.accent : T.muted, margin: 0 }}>
                        {DAYS_S[day.getDay()]}
                      </p>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 1, color: isClosed ? T.red : isToday ? T.accent : T.text, lineHeight: 1, margin: 0 }}>
                        {day.getDate()} {MONTHS[day.getMonth()]}
                      </p>
                    </div>
                    {isClosed && (
                      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.red }}>
                        {holiday ? holiday.title : 'Weekly Off'}
                      </span>
                    )}
                    {!isClosed && trainers.length === 0 && (
                      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.muted }}>No trainers assigned</span>
                    )}
                  </div>
                  {isToday && !isClosed && (
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: T.accent, background: T.accentbg2, border: `1px solid ${T.accent}`, borderRadius: 20, padding: '2px 8px' }}>TODAY</span>
                  )}
                </div>

                {trainers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {trainers.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 4px', background: T.accentbg2, border: `1px solid ${T.accent}`, borderRadius: 20 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 8, color: '#000', flexShrink: 0 }}>
                          {t.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, fontWeight: 600, color: T.text }}>
                          {t.name}
                        </span>
                        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: T.text2 }}>
                          {t.is_full_day ? 'Full Day' : `${fmtTime(t.shift_start)}–${fmtTime(t.shift_end)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── HOLIDAYS ── */}
      {tab === 'holidays' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Weekly offs */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: T.text2, marginBottom: 8 }}>
              Weekly Off Days
            </p>
            {weeklyOffs.length === 0 ? (
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: T.muted }}>No weekly off days set.</p>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                {weeklyOffs.map((d) => (
                  <span key={d} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'capitalize', background: T.redbg, border: `1px solid ${T.red}`, color: T.red, borderRadius: 20, padding: '3px 12px' }}>
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming holidays */}
          {holidays.length === 0 ? (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '32px 0', textAlign: 'center', color: T.muted, fontFamily: "'Barlow', sans-serif", fontSize: 13 }}>
              No upcoming holidays in the next 30 days.
            </div>
          ) : (
            holidays.map((h) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: T.redbg, border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 10 }}>
                <div>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>{h.title}</p>
                  {h.reason && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.text2, margin: '3px 0 0' }}>{h.reason}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 1, color: T.red, margin: 0 }}>
                    {new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: T.muted, margin: '2px 0 0' }}>
                    {new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
