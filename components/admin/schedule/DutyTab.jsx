'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Check, Clock,
  Calendar, Repeat, AlertTriangle, Pencil,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const DAYS_S    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const S = {
  accent:   'var(--if-accent)', accentbg: 'var(--if-accentbg)', accentbg2: 'var(--if-accentbg2)',
  card:     'var(--if-card)',   bg3:      'var(--if-bg3)',
  border:   'var(--if-border)', border2:  'var(--if-border2)',
  text:     'var(--if-text)',   text2:    'var(--if-text2)',   muted: 'var(--if-muted)',
  red:      'var(--if-red)',    redbg:    'rgba(239,68,68,0.09)',
  green:    '#22c55e',          greenbg:  'rgba(34,197,94,0.09)',
  orange:   '#f97316',          orangebg: 'rgba(249,115,22,0.09)',
};

// ── UTC-safe date helpers ─────────────────────────────────────
// All date operations use UTC to avoid timezone shift bugs
// (e.g. India IST+5:30 would shift Mon→Sun for UTC midnight)

function fmtDate(d) {
  // Format a Date object as YYYY-MM-DD using UTC
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function todayUTC() {
  // Get today's date as YYYY-MM-DD in UTC
  return fmtDate(new Date());
}

function fmtDisplay(dateStr) {
  // Display a date string — parse as UTC to avoid day shift
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'UTC',
  });
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function initials(name) { return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2); }
function trainerName(t) { return `${t.profile?.first_name || ''} ${t.profile?.last_name || ''}`.trim(); }

// ── UTC-safe day name from date string ───────────────────────
function getDayNameUTC(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return DAYS_FULL[date.getUTCDay()];
}

// ── UTC-safe day index from date string ──────────────────────
function getDayIndexUTC(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

// ── Generate all dates in range matching days of week (UTC) ──
function generateDates(startDate, endDate, daysOfWeek) {
  const dates = [];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const cur = new Date(Date.UTC(sy, sm - 1, sd));
  const end = new Date(Date.UTC(ey, em - 1, ed));

  while (cur <= end) {
    const dayName = DAYS_FULL[cur.getUTCDay()]; // ← UTC day, not local
    if (daysOfWeek.includes(dayName)) dates.push(fmtDate(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);       // ← UTC increment
  }
  return dates;
}

// ── Check if date is disabled (UTC-safe) ─────────────────────
function isDateDisabled(dateStr, weeklyOffs, holidays) {
  const dayName = getDayNameUTC(dateStr);
  return (weeklyOffs || []).includes(dayName) || (holidays || []).includes(dateStr);
}

export default function DutyTab({ trainers = [] }) {
  const todayStr = todayUTC();

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [duty,         setDuty]         = useState([]);
  const [patterns,     setPatterns]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [assignOpen,   setAssignOpen]   = useState(false);
  const [view,         setView]         = useState('day');
  const [removing,     setRemoving]     = useState(null);
  const [deletingPat,  setDeletingPat]  = useState(null);
  const [settings,     setSettings]     = useState(null);
  const [holidays,     setHolidays]     = useState([]);
  const [branchId,     setBranchId]     = useState(null);
  const [conflicts,    setConflicts]    = useState([]);
  const [editingPat,   setEditingPat]   = useState(null); // pattern being edited

  const defaultForm = {
    trainer_id:   '',
    mode:         'onetime',
    date:         todayStr,
    days_of_week: ['monday','tuesday','wednesday','thursday','friday'],
    start_date:   todayStr,
    end_date:     fmtDate(new Date(Date.now() + 30 * 864e5)),
    is_full_day:  true,
    shift_start:  '06:00',
    shift_end:    '22:00',
  };
  const [form,    setForm]    = useState(defaultForm);
  const [saving,  setSaving]  = useState(false);
  const [preview, setPreview] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/duty');
      if (!res.ok) throw new Error('Failed to fetch duty data');
      const json = await res.json();
      setBranchId(json.branchId);
      setDuty(json.duty       || []);
      setPatterns(json.patterns || []);
      setSettings(json.settings || null);
      setHolidays(json.holidays || []);
    } catch (err) { console.error('DutyTab fetch error:', err?.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Preview + conflict detection ──────────────────────────
  useEffect(() => {
    if (form.mode === 'recurring' && form.days_of_week.length > 0 && form.start_date && form.end_date) {
      const allDates = generateDates(form.start_date, form.end_date, form.days_of_week);
      setPreview(allDates.slice(0, 10));
      if (form.trainer_id) {
        const trainerDates = new Set(duty.filter((d) => d.trainer_id === form.trainer_id).map((d) => d.date));
        setConflicts(allDates.filter((d) => trainerDates.has(d)));
      } else {
        setConflicts([]);
      }
    } else if (form.mode === 'onetime' && form.trainer_id && form.date) {
      const trainerDates = new Set(duty.filter((d) => d.trainer_id === form.trainer_id).map((d) => d.date));
      setConflicts(trainerDates.has(form.date) ? [form.date] : []);
      setPreview([]);
    } else {
      setPreview([]);
      setConflicts([]);
    }
  }, [form.mode, form.days_of_week, form.start_date, form.end_date, form.trainer_id, form.date, duty]);

  const dayDuty = duty.filter((d) => d.date === selectedDate);

  async function removeDuty(dutyId) {
    setRemoving(dutyId);
    try {
      await fetch('/api/admin/duty', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_duty', branchId, data: { id: dutyId } }),
      });
      setDuty((p) => p.filter((d) => d.id !== dutyId));
    } catch (err) { alert(err?.message); }
    finally { setRemoving(null); }
  }

  async function deletePattern(pattern) {
    if (!confirm(`Delete recurring assignment for ${trainerName(pattern.trainer)}?\nThis will remove all future duty entries from this pattern.`)) return;
    setDeletingPat(pattern.id);
    try {
      const futureDates = generateDates(todayStr, pattern.end_date, pattern.days_of_week);
      await fetch('/api/admin/duty', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_pattern_dates', branchId, data: { trainer_id: pattern.trainer_id, dates: futureDates } }),
      });
      await fetch('/api/admin/duty', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_pattern', branchId, data: { id: pattern.id } }),
      });
      await fetchData();
    } catch (err) { alert(err?.message); }
    finally { setDeletingPat(null); }
  }

  // ── Edit pattern ─────────────────────────────────────────────
  function startEditPattern(pattern) {
    setEditingPat(pattern);
    setForm({
      trainer_id:   pattern.trainer_id,
      mode:         'recurring',
      date:         todayStr,
      days_of_week: pattern.days_of_week,
      start_date:   pattern.start_date >= todayStr ? pattern.start_date : todayStr,
      end_date:     pattern.end_date,
      is_full_day:  pattern.is_full_day,
      shift_start:  pattern.shift_start || '06:00',
      shift_end:    pattern.shift_end   || '22:00',
    });
    setConflicts([]);
    setAssignOpen(true);
  }

  async function handleSave() {
    if (!form.trainer_id) { alert('Please select a trainer'); return; }
    if (form.mode === 'recurring' && form.days_of_week.length === 0) { alert('Select at least one day of the week'); return; }
    setSaving(true);
    try {
      const shiftStart = form.is_full_day ? null : form.shift_start;
      const shiftEnd   = form.is_full_day ? null : form.shift_end;

      if (form.mode === 'onetime') {
        if (isDateDisabled(form.date, settings?.weekly_off_days, holidays)) {
          alert('This date is a weekly off or holiday. Cannot assign trainer.');
          setSaving(false); return;
        }
        await fetch('/api/admin/duty', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_duty', branchId, data: { trainer_id: form.trainer_id, date: form.date, is_full_day: form.is_full_day, shift_start: shiftStart, shift_end: shiftEnd } }),
        });
      } else {
        // Include all dates — admin can assign trainer even on holidays/off days
        const dates = generateDates(form.start_date, form.end_date, form.days_of_week);
        if (dates.length === 0) {
          alert('No dates generated for this range and days selection.');
          setSaving(false); return;
        }

        // If editing existing pattern — delete old future entries first
        if (editingPat) {
          const oldFutureDates = generateDates(todayStr, editingPat.end_date, editingPat.days_of_week);
          await fetch('/api/admin/duty', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_pattern_dates', branchId, data: { trainer_id: editingPat.trainer_id, dates: oldFutureDates } }),
          });
          await fetch('/api/admin/duty', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_pattern', branchId, data: { id: editingPat.id } }),
          });
        }

        await fetch('/api/admin/duty', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_pattern', branchId, data: { trainer_id: form.trainer_id, days_of_week: form.days_of_week, start_date: form.start_date, end_date: form.end_date, is_full_day: form.is_full_day, shift_start: shiftStart, shift_end: shiftEnd, dates } }),
        });
      }
      setAssignOpen(false);
      setForm(defaultForm);
      setConflicts([]);
      setEditingPat(null);
      await fetchData();
    } catch (err) { alert(err?.message || 'Failed to save assignment'); }
    finally { setSaving(false); }
  }

  // ── 14-day date strip (UTC) ───────────────────────────────
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() + i * 864e5);
    return fmtDate(d);
  });

  const trainerById = Object.fromEntries((trainers || []).map((t) => [t.id, t]));

  const totalPreviewDates = form.mode === 'recurring' && form.days_of_week.length > 0 && form.start_date && form.end_date
    ? generateDates(form.start_date, form.end_date, form.days_of_week).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 4, background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: 4 }}>
          {[{ id: 'day', label: 'Day View', icon: Calendar }, { id: 'recurring', label: 'Recurring', icon: Repeat }].map((v) => {
            const Icon = v.icon; const on = view === v.id;
            return (
              <button key={v.id} onClick={() => setView(v.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', borderRadius: 7, border: 'none', cursor: 'pointer', background: on ? S.accent : 'transparent', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 600, color: on ? '#000' : S.text2, transition: 'all .15s' }}
              >
                <Icon size={12} /> {v.label}
              </button>
            );
          })}
        </div>
        <Button icon={<Plus size={14} />} onClick={() => { setForm(defaultForm); setConflicts([]); setEditingPat(null); setAssignOpen(true); }}>
          Assign Trainer
        </Button>
      </div>

      {loading ? (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '40px 0', textAlign: 'center', color: S.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Loading...</div>
      ) : view === 'day' ? (
        <>
          {/* Date strip */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {dates.map((date) => {
              const isS        = date === selectedDate;
              const isDisabled = isDateDisabled(date, settings?.weekly_off_days, holidays);
              const dayIdx     = getDayIndexUTC(date);
              const dayNum     = parseInt(date.split('-')[2]);
              const count      = duty.filter((du) => du.date === date).length;
              return (
                <button key={date} onClick={() => setSelectedDate(date)}
                  style={{ minWidth: 54, height: 64, borderRadius: 10, border: `1px solid ${isDisabled ? S.red : isS ? S.accent : S.border2}`, background: isDisabled ? S.redbg : isS ? S.accentbg2 : S.card, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all .15s', flexShrink: 0, opacity: isDisabled ? 0.7 : 1 }}
                >
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: isS ? S.accent : S.muted }}>{DAYS_S[dayIdx]}</span>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 800, color: isS ? S.accent : S.text, lineHeight: 1 }}>{dayNum}</span>
                  {count > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: isS ? S.accent : S.muted }} />
                      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, color: isS ? S.accent : S.muted }}>{count}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day card */}
          <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '13px 18px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: S.text }}>{fmtDisplay(selectedDate)}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: S.muted }}>{dayDuty.length} trainer{dayDuty.length !== 1 ? 's' : ''} on duty</span>
            </div>
            <div style={{ padding: '16px 18px' }}>
              {dayDuty.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: S.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                  No trainers assigned for this day.
                  <div style={{ marginTop: 12 }}>
                    <Button size="sm" icon={<Plus size={13} />} onClick={() => { setForm({ ...defaultForm, date: selectedDate }); setConflicts([]); setAssignOpen(true); }}>Assign Trainer</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dayDuty.map((d) => {
                    const t    = trainerById[d.trainer_id];
                    const name = t ? trainerName(t) : (d.trainer ? trainerName(d.trainer) : 'Unknown');
                    return (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: S.accentbg2, border: `1px solid ${S.accent}`, borderRadius: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: S.accentbg2, border: `1.5px solid ${S.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: S.accent }}>
                            {initials(name)}
                          </div>
                          <div>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{name}</p>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: S.muted, margin: '2px 0 0' }}>
                              {d.is_full_day ? 'Full Day' : `${fmtTime(d.shift_start)} – ${fmtTime(d.shift_end)}`}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => removeDuty(d.id)} disabled={removing === d.id}
                          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${S.border2}`, background: 'transparent', cursor: 'pointer', color: S.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', opacity: removing === d.id ? 0.6 : 1 }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = S.red; e.currentTarget.style.color = S.red; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.border2; e.currentTarget.style.color = S.muted; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Recurring patterns view */
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: `1px solid ${S.border}` }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: S.text }}>Active Recurring Assignments ({patterns.length})</span>
          </div>
          {patterns.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: S.muted, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>No recurring assignments.</div>
          ) : (
            <div style={{ padding: '12px' }}>
              {patterns.map((p) => {
                const name = p.trainer ? trainerName(p.trainer) : 'Unknown';
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '14px', background: S.accentbg2, border: `1px solid ${S.accent}`, borderRadius: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: S.accentbg2, border: `1.5px solid ${S.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: S.accent, flexShrink: 0 }}>
                          {initials(name)}
                        </div>
                        <div>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: S.text, margin: 0 }}>{name}</p>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: S.muted, margin: '2px 0 0' }}>
                            {p.is_full_day ? 'Full Day' : `${fmtTime(p.shift_start)} – ${fmtTime(p.shift_end)}`}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                        {p.days_of_week.map((day) => (
                          <span key={day} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'capitalize', background: S.accentbg2, border: `1px solid ${S.accent}`, color: S.accent, borderRadius: 6, padding: '2px 8px' }}>
                            {day.slice(0, 3).toUpperCase()}
                          </span>
                        ))}
                      </div>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted, margin: 0 }}>
                        {fmtDisplay(p.start_date)} → {fmtDisplay(p.end_date)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => startEditPattern(p)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.border2}`, background: 'transparent', cursor: 'pointer', color: S.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = S.accent; e.currentTarget.style.color = S.accent; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.border2; e.currentTarget.style.color = S.muted; }}
                        title="Edit pattern"
                      >
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deletePattern(p)} disabled={deletingPat === p.id}
                        style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.border2}`, background: 'transparent', cursor: 'pointer', color: S.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s', opacity: deletingPat === p.id ? 0.6 : 1 }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = S.red; e.currentTarget.style.color = S.red; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.border2; e.currentTarget.style.color = S.muted; }}
                        title="Delete pattern"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Assign Modal ── */}
      <Modal open={assignOpen} onClose={() => { setAssignOpen(false); setEditingPat(null); setConflicts([]); }} title={editingPat ? "Edit Recurring Assignment" : "Assign Trainer"} size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>
              {form.mode === 'recurring' ? `Assign (${totalPreviewDates} days)` : 'Assign'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Trainer select */}
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 8 }}>Select Trainer *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(trainers || []).map((t) => {
                const name = trainerName(t);
                const sel  = form.trainer_id === t.id;
                return (
                  <button key={t.id} onClick={() => setForm((p) => ({ ...p, trainer_id: t.id }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: `1px solid ${sel ? S.accent : S.border2}`, background: sel ? S.accentbg2 : 'transparent', cursor: 'pointer', transition: 'all .15s', textAlign: 'left' }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: sel ? S.accentbg2 : S.bg3, border: `1px solid ${sel ? S.accent : S.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, color: sel ? S.accent : S.muted, flexShrink: 0 }}>
                      {initials(name)}
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: sel ? S.accent : S.text }}>{name}</span>
                    {sel && <Check size={14} style={{ color: S.accent, marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conflict warning */}
          {conflicts.length > 0 && (
            <div style={{ display: 'flex', gap: 10, padding: '10px 14px', background: S.orangebg, border: `1px solid ${S.orange}`, borderRadius: 8 }}>
              <AlertTriangle size={15} style={{ color: S.orange, flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: S.orange, margin: '0 0 4px' }}>
                  {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: S.orange, margin: 0 }}>
                  This trainer already has duty on {conflicts.length > 3
                    ? `${conflicts.slice(0, 3).map((d) => { const [y,m,dd] = d.split('-').map(Number); return new Date(Date.UTC(y,m-1,dd)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }); }).join(', ')} +${conflicts.length - 3} more`
                    : conflicts.map((d) => { const [y,m,dd] = d.split('-').map(Number); return new Date(Date.UTC(y,m-1,dd)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }); }).join(', ')
                  }. Saving will overwrite existing entries.
                </p>
              </div>
            </div>
          )}

          <div style={{ height: 1, background: S.border }} />

          {/* Mode toggle */}
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 8 }}>Assignment Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ id: 'onetime', label: 'One-time', icon: Calendar }, { id: 'recurring', label: 'Recurring', icon: Repeat }].map((m) => {
                const Icon = m.icon; const on = form.mode === m.id;
                return (
                  <button key={m.id} onClick={() => setForm((p) => ({ ...p, mode: m.id }))}
                    style={{ flex: 1, height: 40, borderRadius: 8, border: `1px solid ${on ? S.accent : S.border2}`, background: on ? S.accentbg2 : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: on ? S.accent : S.text2, transition: 'all .15s' }}
                  >
                    <Icon size={14} /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* One-time date */}
          {form.mode === 'onetime' && (
            <div>
              <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>Date *</label>
              <input type="date" value={form.date} min={todayStr}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                style={{ width: '100%', height: 38, background: S.bg3, border: `1px solid ${S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.text, outline: 'none' }}
              />
            </div>
          )}

          {/* Recurring */}
          {form.mode === 'recurring' && (
            <>
              <div>
                <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 8 }}>Days of Week *</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DAYS_FULL.map((day, i) => {
                    const on          = form.days_of_week.includes(day);
                    const isWeeklyOff = (settings?.weekly_off_days || []).includes(day);
                    return (
                      <button key={day}
                        onClick={() => setForm((p) => ({ ...p, days_of_week: on ? p.days_of_week.filter((d) => d !== day) : [...p.days_of_week, day] }))}
                        title={isWeeklyOff ? 'Weekly off day' : ''}
                        style={{ width: 42, height: 42, borderRadius: 10, border: `1px solid ${on ? S.accent : isWeeklyOff ? S.red : S.border2}`, background: on ? S.accentbg2 : 'transparent', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: on ? S.accent : isWeeklyOff ? S.red : S.muted, transition: 'all .15s', opacity: isWeeklyOff && !on ? 0.5 : 1 }}
                      >
                        {DAYS_S[i]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>From *</label>
                  <input type="date" value={form.start_date} min={todayStr}
                    onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                    style={{ width: '100%', height: 38, background: S.bg3, border: `1px solid ${S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.text, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>Until *</label>
                  <input type="date" value={form.end_date} min={form.start_date}
                    onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                    style={{ width: '100%', height: 38, background: S.bg3, border: `1px solid ${S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.text, outline: 'none' }}
                  />
                </div>
              </div>

              {preview.length > 0 && (
                <div style={{ padding: '10px 14px', background: S.accentbg2, border: `1px solid ${S.accent}`, borderRadius: 8 }}>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: S.accent, marginBottom: 6 }}>
                    Preview — first {Math.min(preview.length, 10)} dates:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {preview.map((d) => {
                      const [y,m,dd] = d.split('-').map(Number);
                      return (
                        <span key={d} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: S.text2, background: S.bg3, border: `1px solid ${S.border}`, borderRadius: 4, padding: '2px 6px' }}>
                          {new Date(Date.UTC(y,m-1,dd)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                        </span>
                      );
                    })}
                    {totalPreviewDates > 10 && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: S.muted, padding: '2px 4px' }}>
                        +{totalPreviewDates - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ height: 1, background: S.border }} />

          {/* Shift */}
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 8 }}>Shift</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.text }}>Full Day</span>
                <button onClick={() => setForm((p) => ({ ...p, is_full_day: !p.is_full_day }))}
                  style={{ width: 40, height: 22, borderRadius: 11, background: form.is_full_day ? S.accent : S.border2, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', top: 2, left: form.is_full_day ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
                </button>
              </div>
              {!form.is_full_day && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={13} style={{ color: S.muted }} />
                  <input type="time" value={form.shift_start} onChange={(e) => setForm((p) => ({ ...p, shift_start: e.target.value }))}
                    style={{ height: 34, background: S.bg3, border: `1px solid ${S.border2}`, borderRadius: 7, padding: '0 10px', fontFamily: "'DM Mono', monospace", fontSize: 13, color: S.text, outline: 'none' }}
                  />
                  <span style={{ color: S.muted, fontSize: 13 }}>to</span>
                  <input type="time" value={form.shift_end} onChange={(e) => setForm((p) => ({ ...p, shift_end: e.target.value }))}
                    style={{ height: 34, background: S.bg3, border: `1px solid ${S.border2}`, borderRadius: 7, padding: '0 10px', fontFamily: "'DM Mono', monospace", fontSize: 13, color: S.text, outline: 'none' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
