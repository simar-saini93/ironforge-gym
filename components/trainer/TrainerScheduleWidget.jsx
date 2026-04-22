'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Clock, CheckCircle2, XCircle, AlertTriangle, Dumbbell } from 'lucide-react';

const T = {
  accent: '#22c55e', accentbg2: 'rgba(34,197,94,0.14)',
  card: '#111111', card2: '#1a1a1a', border: '#1f1f1f', border2: '#2a2a2a',
  text: '#f0f0f0', text2: '#888888', muted: '#444444',
  red: '#ef4444', redbg: 'rgba(239,68,68,0.09)',
  orange: '#f97316', orangebg: 'rgba(249,115,22,0.09)',
};

const DAYS_S = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

export default function TrainerScheduleWidget() {
  const [duty,       setDuty]       = useState(null);
  const [schedule,   setSchedule]   = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/schedule/trainer').then((r) => r.json()),
      fetch('/api/schedule').then((r) => r.json()),
    ]).then(([dutyData, scheduleData]) => {
      setDuty(dutyData);
      setSchedule(scheduleData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading || !duty || !schedule) return null;

  const { today_duty, upcoming } = duty;
  const { today: gymToday, tomorrow, holidays, gym } = schedule;

  // Next 7 days with duty info
  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d    = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dutyRec = upcoming.find((u) => u.date === dateStr);
    return { date: dateStr, day: d, hasDuty: !!dutyRec, duty: dutyRec };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Tomorrow closed alert */}
      {tomorrow?.is_closed && (
        <div style={{ background: T.orangebg, border: `1px solid ${T.orange}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={15} style={{ color: T.orange, flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '.05em', color: T.orange, margin: 0 }}>
              Gym Closed Tomorrow
            </p>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.text2, margin: '2px 0 0' }}>
              {tomorrow.reason || 'No session tomorrow'}
            </p>
          </div>
        </div>
      )}

      {/* Today's duty status */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dumbbell size={14} style={{ color: T.accent }} />
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1, color: T.text }}>Today's Duty</span>
        </div>
        <div style={{ padding: '14px 18px' }}>
          {gymToday.is_closed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <XCircle size={15} style={{ color: T.red }} />
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: T.red }}>
                Gym closed today {gymToday.holiday ? `· ${gymToday.holiday.title}` : ''}
              </span>
            </div>
          ) : today_duty ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: T.accentbg2, border: `1px solid ${T.accent}`, borderRadius: 10 }}>
              <CheckCircle2 size={15} style={{ color: T.accent }} />
              <div>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 700, color: T.accent, margin: 0 }}>On Duty Today</p>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.text2, margin: '2px 0 0' }}>
                  {today_duty.is_full_day ? 'Full Day' : `${fmtTime(today_duty.shift_start)} — ${fmtTime(today_duty.shift_end)}`}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <XCircle size={15} style={{ color: T.muted }} />
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: T.text2 }}>
                Not on duty today
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Next 7 days duty strip */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1, color: T.text }}>Next 7 Days</span>
        </div>
        <div style={{ padding: '12px 14px', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {next7.map(({ date, day, hasDuty, duty: dr }) => {
            const isToday    = date === new Date().toISOString().split('T')[0];
            const isHoliday  = holidays?.some((h) => h.date === date);
            const weeklyOffs = gym?.weekly_off_days || [];
            const dayName    = day.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const isClosed   = isHoliday || weeklyOffs.includes(dayName);

            return (
              <div key={date} style={{
                minWidth: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '8px 4px', borderRadius: 10,
                background: isToday ? T.accentbg2 : 'transparent',
                border: `1px solid ${isToday ? T.accent : 'transparent'}`,
              }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: isToday ? T.accent : T.muted }}>
                  {DAYS_S[day.getDay()]}
                </span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: isToday ? T.accent : T.text, lineHeight: 1 }}>
                  {day.getDate()}
                </span>
                {isClosed ? (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.redbg, border: `1px solid ${T.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <XCircle size={10} style={{ color: T.red }} />
                  </div>
                ) : hasDuty ? (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.accentbg2, border: `1px solid ${T.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={10} style={{ color: T.accent }} />
                  </div>
                ) : (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.card2, border: `1px solid ${T.border2}` }} />
                )}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ padding: '0 14px 12px', display: 'flex', gap: 14 }}>
          {[
            { color: T.accent, label: 'On duty' },
            { color: T.red,    label: 'Closed'  },
            { color: T.muted,  label: 'Off'     },
          ].map((l) => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: T.muted }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gym timings today */}
      {!gymToday.is_closed && gymToday.timings && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <Clock size={13} style={{ color: T.text2 }} />
          <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.text2 }}>
            Gym hours today:
          </span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: T.accent }}>
            {fmtTime(gymToday.timings.open)} — {fmtTime(gymToday.timings.close)}
          </span>
        </div>
      )}

      {/* Upcoming holidays */}
      {holidays?.length > 0 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} style={{ color: T.orange }} />
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1, color: T.text }}>Upcoming Holidays</span>
          </div>
          <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {holidays.slice(0, 3).map((h) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: T.redbg, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 8 }}>
                <div>
                  <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{h.title}</p>
                  {h.reason && <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: T.text2, margin: '2px 0 0' }}>{h.reason}</p>}
                </div>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: T.red, whiteSpace: 'nowrap', marginLeft: 12 }}>
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
