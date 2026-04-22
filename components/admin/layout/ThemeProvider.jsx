'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeCtx = createContext({ theme: 'dark', toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeCtx);
}

const DARK = {
  '--if-bg':       '#0a0a0a',
  '--if-bg2':      '#111111',
  '--if-bg3':      '#161616',
  '--if-card':     '#1a1a1a',
  '--if-card2':    '#202020',
  '--if-border':   '#252525',
  '--if-border2':  '#2e2e2e',
  '--if-text':     '#f0f0f0',
  '--if-text2':    '#a0a0a0',
  '--if-muted':    '#555555',
  '--if-accent':   '#F5C518',
  '--if-accent-h': '#F7CE3E',
  '--if-accentbg': 'rgba(245,197,24,0.08)',
  '--if-accentbg2':'rgba(245,197,24,0.14)',
  '--if-accentfg': '#000000',
  '--if-green':    '#22c55e',
  '--if-greenbg':  'rgba(34,197,94,0.09)',
  '--if-red':      '#ef4444',
  '--if-redbg':    'rgba(239,68,68,0.09)',
  '--if-blue':     '#38bdf8',
  '--if-bluebg':   'rgba(56,189,248,0.09)',
  '--if-orange':   '#f97316',
  '--if-orangebg': 'rgba(249,115,22,0.09)',
  '--if-purple':   '#a78bfa',
  '--if-purplebg': 'rgba(167,139,250,0.09)',
};

const LIGHT = {
  '--if-bg':       '#f5f5f5',
  '--if-bg2':      '#eeeeee',
  '--if-bg3':      '#e5e5e5',
  '--if-card':     '#ffffff',
  '--if-card2':    '#f9f9f9',
  '--if-border':   '#e0e0e0',
  '--if-border2':  '#d4d4d4',
  '--if-text':     '#0a0a0a',
  '--if-text2':    '#444444',
  '--if-muted':    '#999999',
  '--if-accent':   '#c9a000',
  '--if-accent-h': '#d4aa00',
  '--if-accentbg': 'rgba(201,160,0,0.08)',
  '--if-accentbg2':'rgba(201,160,0,0.14)',
  '--if-accentfg': '#000000',
  '--if-green':    '#16a34a',
  '--if-greenbg':  'rgba(22,163,74,0.09)',
  '--if-red':      '#dc2626',
  '--if-redbg':    'rgba(220,38,38,0.09)',
  '--if-blue':     '#0284c7',
  '--if-bluebg':   'rgba(2,132,199,0.09)',
  '--if-orange':   '#ea580c',
  '--if-orangebg': 'rgba(234,88,12,0.09)',
  '--if-purple':   '#7c3aed',
  '--if-purplebg': 'rgba(124,58,237,0.09)',
};

function applyTheme(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export default function AdminThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('if-admin-theme') || 'dark';
    setTheme(saved);
    applyTheme(saved === 'light' ? LIGHT : DARK);
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('if-admin-theme', next);
      applyTheme(next === 'light' ? LIGHT : DARK);
      return next;
    });
  }

  return (
    <ThemeCtx.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}
