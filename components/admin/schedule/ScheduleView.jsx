'use client';

import { useState, useEffect, useCallback } from 'react';
import DutyTab from '@/components/admin/schedule/DutyTab';
import {
  ChevronLeft, ChevronRight, Plus, X, Clock,
  CalendarDays, Dumbbell, AlertTriangle, Settings,
  Check, Trash2, Sun, Moon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

// ── Constants ────────────────────────────────────────────────
const DAYS    = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_S  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const S = {
  accent:    'var(--if-accent)',
  accentbg:  'var(--if-accentbg)',
  accentbg2: 'var(--if-accentbg2)',
  card:      'var(--if-card)',
  card2:     'var(--if-card2)',
  bg3:       'var(--if-bg3)',
  border:    'var(--if-border)',
  border2:   'var(--if-border2)',
  text:      'var(--if-text)',
  text2:     'var(--if-text2)',
  muted:     'var(--if-muted)',
  red:       'var(--if-red)',
  redbg:     'rgba(239,68,68,0.09)',
  green:     '#22c55e',
  greenbg:   'rgba(34,197,94,0.09)',
  orange:    '#f97316',
  orangebg:  'rgba(249,115,22,0.09)',
  purple:    '#a78bfa',
  purplebg:  'rgba(167,139,250,0.09)',
};

// ── Helpers ──────────────────────────────────────────────────
function fmtDate(date) {
  return date.toISOString().split('T')[0];
}
function ErrMsg({ msg }) {
  if (!msg) return null;
  return <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: S.red, marginTop: 4, marginBottom: 0 }}>{msg}</p>;
}
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ── Section card ─────────────────────────────────────────────
function Section({ title, color = S.accent, icon: Icon, action, children }) {
  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '13px 18px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {Icon && <Icon size={15} style={{ color }} />}
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700, color: S.text }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  );
}

// ── Tab bar ──────────────────────────────────────────────────
const TABS = [
  { id: 'calendar',  label: 'Calendar',      icon: CalendarDays },
  { id: 'duty',      label: 'Trainer Duty',  icon: Dumbbell     },
  { id: 'timings',   label: 'Gym Timings',   icon: Clock        },
  { id: 'holidays',  label: 'Holidays',      icon: AlertTriangle},
];

// ════════════════════════════════════════════════════════════
// TAB 1 — Calendar view
// ════════════════════════════════════════════════════════════
function CalendarTab({ holidays, duty, dayOverrides, settings, onDayClick, selectedDate }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDay     = getFirstDayOfMonth(viewYear, viewMonth);
  const weeklyOffs   = settings?.weekly_off_days || [];

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const holidayDates  = new Set((holidays || []).filter((h) => !h.cancelled_at).map((h) => h.date));
  const dutyDateMap   = {};
  (duty || []).forEach((d) => {
    if (!dutyDateMap[d.date]) dutyDateMap[d.date] = [];
    dutyDateMap[d.date].push(d);
  });
  const overrideMap = {};
  (dayOverrides || []).forEach((o) => { overrideMap[o.date] = o; });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '12px 16px' }}>
        <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.border2}`, background: 'transparent', cursor: 'pointer', color: S.text2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: S.text }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.border2}`, background: 'transparent', cursor: 'pointer', color: S.text2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${S.border}` }}>
          {DAYS_S.map((d, i) => (
            <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: (i === 0 || i === 6) ? S.red : S.muted }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} style={{ minHeight: 80, borderRight: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}` }} />;

            const date        = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday     = date === fmtDate(today);
            const dayOfWeek   = DAYS[(firstDay + day - 1) % 7].toLowerCase();
            const isWeeklyOff = weeklyOffs.includes(dayOfWeek);
            const isHoliday   = holidayDates.has(date);
            const override    = overrideMap[date];
            const isClosed    = isWeeklyOff || isHoliday || override?.is_closed;
            const duties      = dutyDateMap[date] || [];
            const isSelected  = selectedDate === date;
            const isPast      = new Date(date) < new Date(fmtDate(today));

            return (
              <div key={date}
                onClick={() => onDayClick(date)}
                style={{
                  minHeight:   80, padding: '6px',
                  borderRight: `1px solid ${S.border}`,
                  borderBottom:`1px solid ${S.border}`,
                  cursor:      'pointer', transition: 'background .12s',
                  background:  isSelected ? S.accentbg2 : isClosed ? S.redbg : isPast ? 'transparent' : 'transparent',
                  opacity:     isPast ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = S.accentbg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? S.accentbg2 : isClosed ? S.redbg : 'transparent'; }}
              >
                {/* Day number */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{
                    fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 700,
                    color: isToday ? S.accent : isClosed ? S.red : S.text,
                    width: 22, height: 22, borderRadius: '50%',
                    background: isToday ? S.accentbg2 : 'transparent',
                    border: isToday ? `1px solid ${S.accent}` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {day}
                  </span>
                  {isHoliday && <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 8, fontWeight: 700, background: S.redbg, color: S.red, borderRadius: 4, padding: '1px 4px', border: `1px solid ${S.red}` }}>OFF</span>}
                  {isWeeklyOff && !isHoliday && <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 8, fontWeight: 700, background: S.redbg, color: S.red, borderRadius: 4, padding: '1px 4px' }}>CLOSED</span>}
                </div>

                {/* Duty indicators */}
                {duties.slice(0, 2).map((d, i) => (
                  <div key={i} style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", color: S.accent, background: S.accentbg2, borderRadius: 3, padding: '1px 4px', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.trainer_name || 'Trainer'}
                  </div>
                ))}
                {duties.length > 2 && (
                  <div style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", color: S.muted }}>+{duties.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { color: S.accent, bg: S.accentbg2, label: 'Trainer on duty' },
          { color: S.red,    bg: S.redbg,     label: 'Closed / Holiday' },
          { color: S.accent, bg: S.accentbg2, label: 'Today', border: true },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.bg, border: `1px solid ${l.color}` }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: S.muted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 3 — Gym Timings
// ════════════════════════════════════════════════════════════
function TimingsTab({ settings, dayOverrides, onSave }) {
  const supabase = createClient();
  const [localSettings, setLocalSettings] = useState(settings || { default_open: '06:00', default_close: '22:00', weekly_off_days: [] });
  const [localOverrides, setLocalOverrides] = useState(dayOverrides || []);
  const [saving, setSaving] = useState(false);
  const [addOverrideOpen, setAddOverrideOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ date: '', open_time: '06:00', close_time: '22:00', is_closed: false, notes: '' });
  const [overrideErrors, setOverrideErrors] = useState({});

  function validateOverride(form) {
    const errors = {};
    const today = new Date().toISOString().split('T')[0];
    if (!form.date) errors.date = 'Date is required';
    else if (form.date < today) errors.date = 'Date cannot be in the past';
    if (!form.is_closed) {
      if (!form.open_time)  errors.open_time  = 'Opening time is required';
      if (!form.close_time) errors.close_time = 'Closing time is required';
      if (form.open_time && form.close_time && form.close_time <= form.open_time) {
        errors.close_time = 'Closing time must be after opening time';
      }
    }
    return errors;
  }

  useEffect(() => { setLocalSettings(settings || { default_open: '06:00', default_close: '22:00', weekly_off_days: [] }); }, [settings]);
  useEffect(() => { setLocalOverrides(dayOverrides || []); }, [dayOverrides]);

  const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  function toggleWeeklyOff(day) {
    setLocalSettings((p) => ({
      ...p,
      weekly_off_days: p.weekly_off_days?.includes(day)
        ? p.weekly_off_days.filter((d) => d !== day)
        : [...(p.weekly_off_days || []), day],
    }));
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const { data: branch } = await supabase.from('branches').select('id').limit(1).single();
      await supabase.from('gym_schedule_settings').upsert({
        branch_id:        branch.id,
        default_open:     localSettings.default_open,
        default_close:    localSettings.default_close,
        weekly_off_days:  localSettings.weekly_off_days,
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'branch_id' });
      onSave();
    } catch (err) { alert(err?.message || 'Failed to save'); }
    finally { setSaving(false); }
  }

  async function saveOverride() {
    const errs = validateOverride(overrideForm);
    if (Object.keys(errs).length > 0) { setOverrideErrors(errs); return; }
    setOverrideErrors({});
    try {
      const { data: branch } = await supabase.from('branches').select('id').limit(1).single();
      await supabase.from('gym_day_overrides').upsert({
        branch_id:  branch.id,
        date:       overrideForm.date,
        open_time:  overrideForm.is_closed ? null : overrideForm.open_time,
        close_time: overrideForm.is_closed ? null : overrideForm.close_time,
        is_closed:  overrideForm.is_closed,
        notes:      overrideForm.notes || null,
      }, { onConflict: 'branch_id,date' });
      setAddOverrideOpen(false);
      onSave();
    } catch (err) { alert(err?.message || 'Failed to save override'); }
  }

  async function deleteOverride(id) {
    await supabase.from('gym_day_overrides').delete().eq('id', id);
    setLocalOverrides((p) => p.filter((o) => o.id !== id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Default timings */}
      <Section title="Default Gym Timings" icon={Clock} color={S.accent}
        action={<Button size="sm" loading={saving} onClick={saveSettings}>Save</Button>}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>Opens At</label>
            <input type="time" value={localSettings.default_open || '06:00'}
              onChange={(e) => setLocalSettings((p) => ({ ...p, default_open: e.target.value }))}
              style={{ height: 38, background: S.bg3, border: `1px solid ${S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Mono', monospace", fontSize: 14, color: S.text, outline: 'none' }}
            />
          </div>
          <span style={{ color: S.muted, fontSize: 18, marginTop: 20 }}>—</span>
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>Closes At</label>
            <input type="time" value={localSettings.default_close || '22:00'}
              onChange={(e) => setLocalSettings((p) => ({ ...p, default_close: e.target.value }))}
              style={{ height: 38, background: S.bg3, border: `1px solid ${S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Mono', monospace", fontSize: 14, color: S.text, outline: 'none' }}
            />
          </div>
        </div>
      </Section>

      {/* Weekly off days */}
      <Section title="Regular Weekly Off Days" icon={Sun} color={S.orange}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: S.muted, marginBottom: 12 }}>
          Gym will be automatically marked closed on these days every week.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ALL_DAYS.map((day) => {
            const on = localSettings.weekly_off_days?.includes(day);
            return (
              <button key={day} onClick={() => toggleWeeklyOff(day)}
                style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${on ? S.red : S.border2}`, background: on ? S.redbg : 'transparent', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: on ? S.red : S.muted, cursor: 'pointer', textTransform: 'capitalize', transition: 'all .15s' }}
              >
                {day.slice(0, 3).toUpperCase()}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 14 }}>
          <Button size="sm" loading={saving} onClick={saveSettings}>Save Weekly Offs</Button>
        </div>
      </Section>

      {/* Day-specific overrides */}
      <Section title="Custom Day Timings" icon={Settings} color={S.purple}
        action={<Button size="sm" icon={<Plus size={13} />} onClick={() => setAddOverrideOpen(true)}>Add Override</Button>}
      >
        {localOverrides.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.muted, textAlign: 'center', padding: '16px 0' }}>
            No custom timings set. Add an override for a specific date.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {localOverrides.sort((a, b) => a.date.localeCompare(b.date)).map((o) => (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: o.is_closed ? S.redbg : S.bg3, border: `1px solid ${o.is_closed ? S.red : S.border}`, borderRadius: 8 }}>
                <div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>
                    {new Date(o.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: o.is_closed ? S.red : S.muted, margin: '2px 0 0' }}>
                    {o.is_closed ? 'Closed' : `${fmtTime(o.open_time)} – ${fmtTime(o.close_time)}`}
                    {o.notes && ` · ${o.notes}`}
                  </p>
                </div>
                <button onClick={() => deleteOverride(o.id)}
                  style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${S.border2}`, background: 'transparent', cursor: 'pointer', color: S.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = S.red; e.currentTarget.style.color = S.red; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.border2; e.currentTarget.style.color = S.muted; }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Add override modal */}
      <Modal open={addOverrideOpen} onClose={() => { setAddOverrideOpen(false); setOverrideErrors({}); }} title="Add Custom Timing" size="sm"
        footer={<><Button variant="ghost" onClick={() => setAddOverrideOpen(false)}>Cancel</Button><Button onClick={saveOverride}>Save Override</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>Date *</label>
            <input type="date" value={overrideForm.date} onChange={(e) => { setOverrideForm((p) => ({ ...p, date: e.target.value })); setOverrideErrors((e) => ({ ...e, date: undefined })); }}
              style={{ width: '100%', height: 38, background: S.bg3, border: `1px solid ${overrideErrors.date ? S.red : S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.text, outline: 'none' }}
            />
            <ErrMsg msg={overrideErrors.date} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.text }}>Mark as Closed</span>
            <button onClick={() => setOverrideForm((p) => ({ ...p, is_closed: !p.is_closed }))}
              style={{ width: 40, height: 22, borderRadius: 11, background: overrideForm.is_closed ? S.red : S.border2, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}
            >
              <div style={{ position: 'absolute', top: 2, left: overrideForm.is_closed ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
            </button>
          </div>
          {!overrideForm.is_closed && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>Opens</label>
                <input type="time" value={overrideForm.open_time} onChange={(e) => { setOverrideForm((p) => ({ ...p, open_time: e.target.value })); setOverrideErrors((e) => ({ ...e, open_time: undefined })); }}
                  style={{ width: '100%', height: 38, background: S.bg3, border: `1px solid ${overrideErrors.open_time ? S.red : S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Mono', monospace", fontSize: 13, color: S.text, outline: 'none' }}
                />
                <ErrMsg msg={overrideErrors.open_time} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>Closes</label>
                <input type="time" value={overrideForm.close_time} onChange={(e) => { setOverrideForm((p) => ({ ...p, close_time: e.target.value })); setOverrideErrors((e) => ({ ...e, close_time: undefined })); }}
                  style={{ width: '100%', height: 38, background: S.bg3, border: `1px solid ${overrideErrors.close_time ? S.red : S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Mono', monospace", fontSize: 13, color: S.text, outline: 'none' }}
                />
                <ErrMsg msg={overrideErrors.close_time} />
              </div>
            </div>
          )}
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>Notes (optional)</label>
            <input type="text" value={overrideForm.notes} onChange={(e) => setOverrideForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Special event hours"
              style={{ width: '100%', height: 38, background: S.bg3, border: `1px solid ${S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.text, outline: 'none' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 4 — Holidays
// ════════════════════════════════════════════════════════════
function HolidaysTab({ holidays, onSave }) {
  const supabase = createClient();
  const [addOpen,    setAddOpen]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [form,       setForm]       = useState({ date: '', title: '', reason: '' });
  const [formErrors, setFormErrors] = useState({});

  function validateHoliday(form, existing) {
    const errors = {};
    const today  = new Date().toISOString().split('T')[0];
    if (!form.date) errors.date = 'Date is required';
    else if (form.date < today) errors.date = 'Date cannot be in the past';
    else if (existing.some((h) => h.date === form.date && !h.cancelled_at)) errors.date = 'A holiday already exists on this date';
    if (!form.title || form.title.trim().length < 2) errors.title = 'Holiday name must be at least 2 characters';
    return errors;
  }

  const upcoming = (holidays || []).filter((h) => !h.cancelled_at && new Date(h.date) >= new Date()).sort((a, b) => a.date.localeCompare(b.date));
  const past     = (holidays || []).filter((h) => new Date(h.date) < new Date() || h.cancelled_at).sort((a, b) => b.date.localeCompare(a.date));

  async function addHoliday() {
    const errs = validateHoliday(form, holidays || []);
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    setSaving(true);
    try {
      const { data: branch } = await supabase.from('branches').select('id, name').limit(1).single();
      await supabase.from('gym_holidays').insert({
        branch_id: branch.id,
        date:      form.date,
        title:     form.title,
        reason:    form.reason || null,
      });

      // Send notification email via API
      await fetch('/api/admin/schedule/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: form.date, title: form.title, reason: form.reason, action: 'add' }),
      });

      setAddOpen(false);
      setForm({ date: '', title: '', reason: '' });
      onSave();
    } catch (err) { alert(err?.message || 'Failed to add holiday'); }
    finally { setSaving(false); }
  }

  async function cancelHoliday(holiday) {
    if (!confirm(`Cancel holiday "${holiday.title}" on ${holiday.date}? Members will be notified the gym is open.`)) return;
    setCancelling(holiday.id);
    try {
      await supabase.from('gym_holidays').update({ cancelled_at: new Date().toISOString() }).eq('id', holiday.id);

      // Send cancellation email
      await fetch('/api/admin/schedule/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: holiday.date, title: holiday.title, action: 'cancel' }),
      });

      onSave();
    } catch (err) { alert(err?.message || 'Failed to cancel holiday'); }
    finally { setCancelling(null); }
  }

  function HolidayCard({ h, showCancel = false }) {
    const isCancelled = !!h.cancelled_at;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: isCancelled ? S.bg3 : S.redbg, border: `1px solid ${isCancelled ? S.border : S.red}`, borderRadius: 10, opacity: isCancelled ? 0.6 : 1 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: isCancelled ? S.muted : S.text, margin: 0, textDecoration: isCancelled ? 'line-through' : 'none' }}>
              {h.title}
            </p>
            {isCancelled && <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, color: S.muted, background: S.bg3, border: `1px solid ${S.border}`, borderRadius: 4, padding: '1px 5px', letterSpacing: '.05em' }}>CANCELLED</span>}
            {h.notify_sent_at && !isCancelled && <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, color: S.green, background: S.greenbg, border: `1px solid ${S.green}`, borderRadius: 4, padding: '1px 5px', letterSpacing: '.05em' }}>NOTIFIED</span>}
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: S.muted, margin: 0 }}>
            {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {h.reason && ` · ${h.reason}`}
          </p>
        </div>
        {showCancel && !isCancelled && (
          <button onClick={() => cancelHoliday(h)}
            disabled={cancelling === h.id}
            style={{ height: 30, padding: '0 12px', borderRadius: 7, border: `1px solid ${S.border2}`, background: 'transparent', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: S.muted, cursor: 'pointer', transition: 'all .15s', opacity: cancelling === h.id ? 0.6 : 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = S.red; e.currentTarget.style.color = S.red; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = S.border2; e.currentTarget.style.color = S.muted; }}
          >
            {cancelling === h.id ? 'Cancelling...' : 'Cancel Holiday'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Upcoming */}
      <Section title="Upcoming Holidays" icon={AlertTriangle} color={S.red}
        action={<Button size="sm" icon={<Plus size={13} />} onClick={() => setAddOpen(true)}>Add Holiday</Button>}
      >
        {upcoming.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.muted, textAlign: 'center', padding: '16px 0' }}>No upcoming holidays.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map((h) => <HolidayCard key={h.id} h={h} showCancel />)}
          </div>
        )}
      </Section>

      {/* Past / Cancelled */}
      {past.length > 0 && (
        <Section title="Past & Cancelled" icon={CalendarDays} color={S.muted}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {past.slice(0, 5).map((h) => <HolidayCard key={h.id} h={h} />)}
          </div>
        </Section>
      )}

      {/* Add holiday modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setFormErrors({}); }} title="Add Holiday" size="sm"
        footer={<><Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button><Button loading={saving} onClick={addHoliday}>Add &amp; Notify Members</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>Date *</label>
            <input type="date" value={form.date} onChange={(e) => { setForm((p) => ({ ...p, date: e.target.value })); setFormErrors((e) => ({ ...e, date: undefined })); }}
              min={new Date().toISOString().split('T')[0]}
              style={{ width: '100%', height: 38, background: S.bg3, border: `1px solid ${formErrors.date ? S.red : S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.text, outline: 'none' }}
            />
            <ErrMsg msg={formErrors.date} />
          </div>
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>Holiday Name *</label>
            <input type="text" value={form.title} onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); setFormErrors((e) => ({ ...e, title: undefined })); }}
              placeholder="e.g. Diwali, Independence Day"
              style={{ width: '100%', height: 38, background: S.bg3, border: `1px solid ${formErrors.title ? S.red : S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.text, outline: 'none' }}
            />
            <ErrMsg msg={formErrors.title} />
          </div>
          <div>
            <label style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: S.muted, display: 'block', marginBottom: 6 }}>Reason (optional)</label>
            <input type="text" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. National holiday, gym maintenance"
              style={{ width: '100%', height: 38, background: S.bg3, border: `1px solid ${S.border2}`, borderRadius: 8, padding: '0 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.text, outline: 'none' }}
            />
          </div>
          <div style={{ padding: '10px 14px', background: S.orangebg, border: `1px solid ${S.orange}`, borderRadius: 8 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: S.orange, margin: 0 }}>
              📧 An email notification will be sent to all active members and trainers when you save.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN — ScheduleView
// ════════════════════════════════════════════════════════════
export default function ScheduleView() {
  const supabase = createClient();
  const [activeTab,    setActiveTab]    = useState('calendar');
  const [loading,      setLoading]      = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [data,         setData]         = useState({ settings: null, holidays: [], duty: [], dayOverrides: [], trainers: [] });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: branch } = await supabase.from('branches').select('id').limit(1).single();
      if (!branch) { setLoading(false); return; }

      const [
        { data: settings    },
        { data: holidays    },
        { data: duty        },
        { data: dayOverrides},
        { data: trainers    },
      ] = await Promise.all([
        supabase.from('gym_schedule_settings').select('*').eq('branch_id', branch.id).maybeSingle(),
        supabase.from('gym_holidays').select('*').eq('branch_id', branch.id).order('date', { ascending: true }),
        supabase.from('trainer_duty').select('*, trainer:trainers(id, profile:profiles(first_name, last_name))').eq('branch_id', branch.id).gte('date', new Date().toISOString().split('T')[0]),
        supabase.from('gym_day_overrides').select('*').eq('branch_id', branch.id).order('date', { ascending: true }),
        supabase.from('trainers').select('id, specialization, branch_id, profile:profiles(first_name, last_name)').eq('is_active', true),
      ]);

      // Shape duty with trainer names
      const shapedDuty = (duty || []).map((d) => ({
        ...d,
        trainer_name: `${d.trainer?.profile?.first_name || ''} ${d.trainer?.profile?.last_name || ''}`.trim(),
      }));

      setData({ settings, holidays: holidays || [], duty: shapedDuty, dayOverrides: dayOverrides || [], trainers: trainers || [] });
    } catch (err) { console.error('Schedule fetch error:', err?.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: 6, flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all .15s', background: active ? S.accent : 'transparent', fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600, color: active ? '#000' : S.text2 }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = S.bg3; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {loading ? (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12, padding: '60px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: S.muted }}>Loading schedule...</p>
        </div>
      ) : (
        <>
          {activeTab === 'calendar' && (
            <CalendarTab
              holidays={data.holidays}
              duty={data.duty}
              dayOverrides={data.dayOverrides}
              settings={data.settings}
              selectedDate={selectedDate}
              onDayClick={(date) => { setSelectedDate(date); setActiveTab('duty'); }}
            />
          )}
          {activeTab === 'duty'     && <DutyTab trainers={data.trainers} />}
          {activeTab === 'timings'  && <TimingsTab settings={data.settings} dayOverrides={data.dayOverrides} onSave={fetchAll} />}
          {activeTab === 'holidays' && <HolidaysTab holidays={data.holidays} onSave={fetchAll} />}
        </>
      )}
    </div>
  );
}
