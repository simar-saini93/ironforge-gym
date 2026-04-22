'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/utils/format';
import Badge from '@/components/ui/Badge';

const M = {
  accent: '#E8FF00', accentbg2: 'rgba(232,255,0,0.14)',
  card: '#111111', card2: '#1a1a1a', border: '#1f1f1f',
  text: '#f0f0f0', text2: '#888888', muted: '#444444',
  green: '#22c55e', greenbg: 'rgba(34,197,94,0.09)',
  red: '#ef4444',
};

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [year, month] = key.split('-');
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function groupByMonth(logs) {
  const groups = {};
  logs.forEach((log) => {
    const key = monthKey(log.accessed_at);
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  });
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function MemberAttendance() {
  const supabase = createClient();

  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [memberId, setMemberId] = useState(null);
  const [thisMonth, setThisMonth] = useState(0);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: member }   = await supabase.from('members').select('id').eq('profile_id', user.id).single();
      if (member) setMemberId(member.id);
    }
    init();
  }, []);

  useEffect(() => {
    if (!memberId) return;
    async function fetch() {
      setLoading(true);

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [{ data: allLogs }, { count: monthCount }] = await Promise.all([
        supabase
          .from('access_logs')
          .select('id, method, status, accessed_at, denied_reason')
          .eq('member_id', memberId)
          .eq('status', 'granted')
          .order('accessed_at', { ascending: false }),

        supabase
          .from('access_logs')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', memberId)
          .eq('status', 'granted')
          .gte('accessed_at', startOfMonth),
      ]);

      setLogs(allLogs || []);
      setThisMonth(monthCount || 0);
      setLoading(false);
    }
    fetch();
  }, [memberId]);

  const grouped = groupByMonth(logs);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header + summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color: M.text }}>Attendance</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* This month */}
          <div style={{ background: M.accentbg2, border: `1px solid ${M.accent}`, borderRadius: 10, padding: '8px 18px', textAlign: 'right' }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: M.accent }}>This Month</p>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1, color: M.accent }}>{thisMonth}</p>
          </div>
          {/* All time */}
          <div style={{ background: M.card, border: `1px solid ${M.border}`, borderRadius: 10, padding: '8px 18px', textAlign: 'right' }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: M.text2 }}>All Time</p>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1, color: M.text }}>{logs.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: M.text2, fontFamily: "'Barlow', sans-serif", fontSize: 14 }}>Loading...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: M.text2, fontFamily: "'Barlow', sans-serif", fontSize: 14 }}>
          No attendance records yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {grouped.map(([key, entries]) => (
            <div key={key}>
              {/* Month header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: 1, color: M.accent }}>
                  {monthLabel(key)}
                </span>
                <div style={{ flex: 1, height: 1, background: M.border }} />
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: M.text2 }}>
                  {entries.length} visit{entries.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Entries */}
              <div style={{ background: M.card, border: `1px solid ${M.border}`, borderRadius: 14, overflow: 'hidden' }}>
                {entries.map((log, i) => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < entries.length - 1 ? `1px solid ${M.border}` : 'none', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: M.text }}>
                        {formatDateTime(log.accessed_at)}
                      </p>
                      <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: M.text2, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>
                        {log.method === 'qr' ? 'QR Scan' : 'Daily Code'}
                      </p>
                    </div>
                    <Badge variant="active" size="sm">Granted</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
