'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Dumbbell, UserPlus, BarChart2, X, ArrowRight, Loader2 } from 'lucide-react';

function ResultItem({ icon: Icon, iconColor = 'var(--if-accent)', label, sublabel, badge, onClick, active }) {
  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', background: active ? 'var(--if-accentbg2)' : 'transparent', transition: 'background .1s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--if-accentbg)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = active ? 'var(--if-accentbg2)' : 'transparent')}
    >
      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--if-bg3)', border: '1px solid var(--if-border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} style={{ color: iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--if-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
        {sublabel && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--if-muted)', marginTop: 1 }}>{sublabel}</p>}
      </div>
      {badge && (
        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--if-muted)', background: 'var(--if-bg3)', border: '1px solid var(--if-border)', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
          {badge}
        </span>
      )}
    </div>
  );
}

function GroupHeader({ label }) {
  return (
    <div style={{ padding: '8px 14px 4px', fontFamily: "'Outfit', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--if-muted)', borderTop: '1px solid var(--if-border)' }}>
      {label}
    </div>
  );
}

export default function SearchBar() {
  const router   = useRouter();
  const inputRef = useRef(null);
  const dropRef  = useRef(null);
  const abortRef = useRef(null);

  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [open,    setOpen]    = useState(false);
  const [cursor,  setCursor]  = useState(-1);

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = useCallback(async (q) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { signal: abortRef.current.signal });
      if (!res.ok) { const { error } = await res.json(); throw new Error(error || 'Search failed'); }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('Search failed. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCursor(-1);
    if (query.trim().length < 2) { setResults(null); setOpen(false); setError(null); return; }
    setOpen(true);
    const t = setTimeout(() => search(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  const flat = results ? [
    ...(results.members  || []).map((d) => ({ type: 'member',  data: d })),
    ...(results.trainers || []).map((d) => ({ type: 'trainer', data: d })),
    ...(results.leads    || []).map((d) => ({ type: 'lead',    data: d })),
    ...(results.reports  || []).map((d) => ({ type: 'report',  data: d })),
  ] : [];

  const hasResults = flat.length > 0;

  function navigate(item) {
    setOpen(false); setQuery(''); setResults(null);
    if (item.type === 'member')  router.push(`/admin/members/${item.data.id}`);
    if (item.type === 'trainer') router.push(`/admin/trainers/${item.data.id}`);
    if (item.type === 'lead')    router.push(`/admin/crm/${item.data.id}`);
    if (item.type === 'report')  router.push(`/admin/reports?tab=${item.data.tab}`);
  }

  function goToSearch() {
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/admin/search?q=${encodeURIComponent(query.trim())}`);
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor((c) => Math.max(c - 1, -1)); }
    if (e.key === 'Enter')     { e.preventDefault(); if (cursor >= 0 && flat[cursor]) navigate(flat[cursor]); else goToSearch(); }
    if (e.key === 'Escape')    { setOpen(false); inputRef.current?.blur(); }
  }

  const n = (o) => `${o.first_name || ''} ${o.last_name || ''}`.trim();

  return (
    <div style={{ position: 'relative' }} ref={dropRef}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--if-card)', border: `1px solid ${open ? 'var(--if-accent)' : 'var(--if-border2)'}`, boxShadow: open ? '0 0 0 3px var(--if-accentbg)' : 'none', borderRadius: open ? '8px 8px 0 0' : 8, padding: '0 12px', height: 36, minWidth: 300, transition: 'border-color .2s, box-shadow .2s, border-radius .1s' }}>
        {loading
          ? <Loader2 size={13} style={{ flexShrink: 0, color: 'var(--if-accent)', animation: 'spin 1s linear infinite' }} />
          : <Search size={13} style={{ flexShrink: 0, cursor: query ? 'pointer' : 'default', color: query ? 'var(--if-accent)' : 'var(--if-muted)' }} onClick={goToSearch} />
        }
        <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} onFocus={() => { if (query.trim().length >= 2) setOpen(true); }} placeholder="Search members, leads, reports..."
          style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-text)', width: '100%' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults(null); setOpen(false); inputRef.current?.focus(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--if-muted)', display: 'flex', padding: 0, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--if-card)', border: '1px solid var(--if-accent)', borderTop: '1px solid var(--if-border)', borderRadius: '0 0 10px 10px', boxShadow: '0 8px 32px rgba(0,0,0,.5)', zIndex: 200, maxHeight: 420, overflowY: 'auto' }}>

          {loading && (
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={14} style={{ color: 'var(--if-accent)', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>Searching...</span>
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: '14px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-red)' }}>{error}</p>
            </div>
          )}

          {!loading && !error && results && !hasResults && (
            <div style={{ padding: '14px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--if-muted)' }}>No results for "<strong style={{ color: 'var(--if-text)' }}>{query}</strong>"</p>
            </div>
          )}

          {!loading && !error && hasResults && (
            <>
              {results.members?.length > 0 && (<><GroupHeader label="Members" />{results.members.map((m) => { const idx = flat.findIndex((f) => f.type === 'member' && f.data.id === m.id); return (<ResultItem key={m.id} icon={User} iconColor="var(--if-accent)" label={n(m)} sublabel={m.email} badge={m.member_number} active={cursor === idx} onClick={() => navigate({ type: 'member', data: m })} />); })}</>)}
              {results.trainers?.length > 0 && (<><GroupHeader label="Trainers" />{results.trainers.map((t) => { const idx = flat.findIndex((f) => f.type === 'trainer' && f.data.id === t.id); return (<ResultItem key={t.id} icon={Dumbbell} iconColor="#a78bfa" label={n(t)} sublabel={t.specialization || t.email} active={cursor === idx} onClick={() => navigate({ type: 'trainer', data: t })} />); })}</>)}
              {results.leads?.length > 0 && (<><GroupHeader label="Leads" />{results.leads.map((l) => { const idx = flat.findIndex((f) => f.type === 'lead' && f.data.id === l.id); return (<ResultItem key={l.id} icon={UserPlus} iconColor="#38bdf8" label={n(l)} sublabel={l.phone || l.email} badge={l.status} active={cursor === idx} onClick={() => navigate({ type: 'lead', data: l })} />); })}</>)}
              {results.reports?.length > 0 && (<><GroupHeader label="Reports" />{results.reports.map((r) => { const idx = flat.findIndex((f) => f.type === 'report' && f.data.tab === r.tab); return (<ResultItem key={r.tab} icon={BarChart2} iconColor="#22c55e" label={r.label} active={cursor === idx} onClick={() => navigate({ type: 'report', data: r })} />); })}</>)}
              <div onClick={goToSearch} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', borderTop: '1px solid var(--if-border)', cursor: 'pointer', transition: 'background .1s' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--if-accentbg)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--if-accent)' }}>View all results for "{query}"</span>
                <ArrowRight size={12} style={{ color: 'var(--if-accent)' }} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
