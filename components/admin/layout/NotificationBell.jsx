'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, UserPlus, Clock, AlertTriangle,
  CheckCheck, Dumbbell, X, RefreshCw,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const PRIORITY_CONFIG = {
  urgent:  { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)'   },
  high:    { color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)'  },
  warning: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)'  },
  info:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)' },
};

const TYPE_ICON = {
  new_lead:         UserPlus,
  stale_lead:       Clock,
  expiring_soon:    AlertTriangle,
  expired:          AlertTriangle,
  trainer_unmarked: Dumbbell,
};

const GROUP_LABELS = {
  new_lead:         'New Leads',
  stale_lead:       'Needs Attention',
  expiring_soon:    'Expiring Soon',
  expired:          'Expired',
  trainer_unmarked: 'Trainer Attendance',
};

// ── Single notification item ─────────────────────────────────
function NotifItem({ notif, onNavigate }) {
  const cfg  = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.info;
  const Icon = TYPE_ICON[notif.type] || Bell;

  return (
    <div
      onClick={() => onNavigate(notif.link)}
      style={{
        display:    'flex', alignItems: 'flex-start', gap: 10,
        padding:    '10px 14px',
        background: notif.read ? 'transparent' : cfg.bg,
        borderLeft: `2px solid ${notif.read ? 'transparent' : cfg.color}`,
        cursor:     'pointer', transition: 'background .12s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--if-accentbg)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = notif.read ? 'transparent' : cfg.bg)}
    >
      {/* Icon */}
      <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon size={13} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: notif.read ? 400 : 600, color: 'var(--if-text)', margin: 0, lineHeight: 1.4 }}>
          {notif.title}
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)', margin: '2px 0 0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {notif.body}
        </p>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--if-muted)', margin: '4px 0 0', opacity: .7 }}>
          {timeAgo(notif.time)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 5 }} />
      )}
    </div>
  );
}

// ── Group header ─────────────────────────────────────────────
function GroupHeader({ label, count }) {
  return (
    <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--if-border)' }}>
      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-muted)' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, color: 'var(--if-muted)' }}>
        {count}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function NotificationBell() {
  const router  = useRouter();
  const dropRef = useRef(null);
  const btnRef  = useRef(null);

  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [lastFetched,   setLastFetched]   = useState(null);
  const [readIds,       setReadIds]       = useState(new Set());

  // ── Fetch notifications ─────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnread((data.notifications || []).filter((n) => !readIds.has(n.id)).length);
      setLastFetched(new Date());
    } catch (err) {
      console.error('[NotificationBell]', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [readIds]);

  // ── Initial fetch + polling every 60s ──────────────────
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Close on outside click ──────────────────────────────
  useEffect(() => {
    function handle(e) {
      if (
        dropRef.current && !dropRef.current.contains(e.target) &&
        btnRef.current  && !btnRef.current.contains(e.target)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ── Mark all as read when panel opens ──────────────────
  function handleOpen() {
    setOpen((p) => !p);
    if (!open) {
      const allIds = new Set(notifications.map((n) => n.id));
      setReadIds(allIds);
      setUnread(0);
    }
  }

  function handleNavigate(link) {
    setOpen(false);
    router.push(link);
  }

  // ── Group notifications by type ─────────────────────────
  const grouped = notifications.reduce((acc, n) => {
    const key = n.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push({ ...n, read: readIds.has(n.id) });
    return acc;
  }, {});

  const TYPE_ORDER = ['new_lead', 'expired', 'expiring_soon', 'stale_lead', 'trainer_unmarked'];
  const sortedGroups = TYPE_ORDER.filter((t) => grouped[t]?.length > 0);

  const iconBtnStyle = {
    width: 36, height: 36,
    background:   'var(--if-card)',
    border:       '1px solid var(--if-border2)',
    borderRadius: 8,
    display:      'flex', alignItems: 'center', justifyContent: 'center',
    cursor:       'pointer', color: 'var(--if-text2)',
    flexShrink:   0, transition: 'all .18s',
    position:     'relative',
  };

  return (
    <div style={{ position: 'relative' }}>

      {/* ── Bell button ── */}
      <button ref={btnRef} onClick={handleOpen} style={iconBtnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
        aria-label="Notifications"
      >
        <Bell size={15} />
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            minWidth: unread > 9 ? 16 : 8,
            height: unread > 9 ? 16 : 8,
            background: '#ef4444',
            borderRadius: unread > 9 ? 8 : '50%',
            border: '1.5px solid var(--if-bg2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 9, fontWeight: 700, color: '#fff',
            padding: unread > 9 ? '0 3px' : 0,
          }}>
            {unread > 9 ? '9+' : ''}
          </div>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div ref={dropRef} style={{
          position:    'absolute', top: 'calc(100% + 8px)', right: 0,
          width:       360,
          background:  'var(--if-card)',
          border:      '1px solid var(--if-border2)',
          borderRadius: 12,
          boxShadow:   '0 8px 32px rgba(0,0,0,.5)',
          zIndex:      200,
          overflow:    'hidden',
        }}>

          {/* Header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--if-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--if-text)' }}>
                Notifications
              </span>
              {notifications.length > 0 && (
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, padding: '2px 8px' }}>
                  {notifications.length}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastFetched && (
                <button onClick={() => fetchNotifications()}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--if-muted)', display: 'flex', padding: 2, borderRadius: 4, transition: 'color .15s' }}
                  title="Refresh"
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
                >
                  <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--if-muted)', display: 'flex', padding: 2, borderRadius: 4, transition: 'color .15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ maxHeight: 440, overflowY: 'auto' }}>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

            {loading ? (
              <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={18} style={{ color: 'var(--if-muted)', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Bell size={28} style={{ color: 'var(--if-muted)', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--if-text)', marginBottom: 4 }}>
                  All caught up!
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>
                  No new notifications
                </p>
              </div>
            ) : (
              sortedGroups.map((type) => (
                <div key={type}>
                  <GroupHeader label={GROUP_LABELS[type]} count={grouped[type].length} />
                  {grouped[type].map((n) => (
                    <NotifItem key={n.id} notif={n} onNavigate={handleNavigate} />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--if-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)' }}>
                {lastFetched ? `Updated ${timeAgo(lastFetched.toISOString())}` : ''}
              </span>
              <button
                onClick={() => { setReadIds(new Set(notifications.map((n) => n.id))); setUnread(0); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--if-accent)', padding: 0, transition: 'opacity .15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
