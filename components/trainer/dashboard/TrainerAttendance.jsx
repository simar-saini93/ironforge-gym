'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils/format';
import Badge from '@/components/ui/Badge';

const T = {
  accent: '#22c55e', accentbg2: 'rgba(34,197,94,0.14)',
  card: '#111111', card2: '#1a1a1a', border: '#1f1f1f',
  text: '#f0f0f0', text2: '#888888', muted: '#444444',
  green: '#22c55e', greenbg: 'rgba(34,197,94,0.09)',
  red: '#ef4444', redbg: 'rgba(239,68,68,0.09)',
  orange: '#f97316', orangebg: 'rgba(249,115,22,0.09)',
  border2: '#2a2a2a',
};

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(key) {
  const [year, month] = key.split('-');
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
function groupByMonth(records) {
  const groups = {};
  records.forEach((r) => {
    const key = monthKey(r.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function TrainerAttendance() {
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [thisMonth, setThisMonth] = useState({ present: 0, absent: 0, leave: 0 });
  const [allTime,   setAllTime]   = useState({ present: 0, absent: 0, leave: 0 });
  const [page,      setPage]      = useState(1);
  const [pages,     setPages]     = useState(1);

  const fetchPage = useCallback((p) => {
    setLoading(true);
    fetch(`/api/trainer/attendance?page=${p}`)
      .then((r) => r.json())
      .then(({ records, thisMonth, allTime, pages }) => {
        setRecords(records || []);
        setThisMonth(thisMonth || { present: 0, absent: 0, leave: 0 });
        setAllTime(allTime   || { present: 0, absent: 0, leave: 0 });
        setPages(pages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  function handlePage(p) { setPage(p); fetchPage(p); }

  const tmTotal = thisMonth.present + thisMonth.absent + thisMonth.leave;
  const tmRate  = tmTotal > 0 ? Math.round((thisMonth.present / tmTotal) * 100) : 0;
  const grouped = groupByMonth(records);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color: T.text }}>Attendance</h2>

      {/* This month summary */}
      <div>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: T.text2, marginBottom: 10 }}>This Month</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Present', value: thisMonth.present, color: T.green,  bg: T.greenbg   },
            { label: 'Absent',  value: thisMonth.absent,  color: T.red,    bg: T.redbg     },
            { label: 'Leave',   value: thisMonth.leave,   color: T.orange, bg: T.orangebg  },
            { label: 'Rate',    value: `${tmRate}%`,      color: T.accent, bg: T.accentbg2 },
          ].map((s) => (
            <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 1, color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, color: T.text2, marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All time summary */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'Total Present', value: allTime.present },
          { label: 'Total Absent',  value: allTime.absent  },
          { label: 'Total Leave',   value: allTime.leave   },
        ].map((s) => (
          <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 16px', flex: 1, textAlign: 'center' }}>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: T.text, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 10, color: T.text2, marginTop: 3 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* History */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: T.text2, fontFamily: "'Barlow', sans-serif", fontSize: 13 }}>Loading...</p>
      ) : records.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px 0', color: T.text2, fontFamily: "'Barlow', sans-serif", fontSize: 13 }}>No attendance records yet.</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {grouped.map(([key, entries]) => {
              const mp   = entries.filter((e) => e.status === 'present').length;
              const rate = entries.length > 0 ? Math.round((mp / entries.length) * 100) : 0;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: 1, color: T.accent }}>{monthLabel(key)}</span>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: T.text2 }}>
                      {mp}/{entries.length} present · {rate}%
                    </span>
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    {entries.map((r, i) => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < entries.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: T.text }}>{formatDate(r.date)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {r.notes && <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: T.text2 }}>{r.notes}</span>}
                          <Badge variant={r.status} size="sm">{r.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => handlePage(p)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${p === page ? T.accent : T.border2}`, background: p === page ? T.accentbg2 : 'transparent', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: p === page ? T.accent : T.text2, cursor: 'pointer', transition: 'all .15s' }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
