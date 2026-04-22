'use client';

import dynamic from 'next/dynamic';
const GymStatusBar = dynamic(() => import('@/components/shared/GymStatusBar'), { ssr: false });

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, CalendarDays,
  LogOut, Menu, X, Dumbbell,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const T = {
  bg:        '#080808',
  bg2:       '#0e0e0e',
  bg3:       '#141414',
  card:      '#111111',
  card2:     '#1a1a1a',
  border:    '#1f1f1f',
  border2:   '#2a2a2a',
  text:      '#f0f0f0',
  text2:     '#888888',
  muted:     '#444444',
  accent:    '#22c55e',
  accentbg:  'rgba(34,197,94,0.08)',
  accentbg2: 'rgba(34,197,94,0.14)',
  red:       '#ef4444',
};

const NAV = [
  { label: 'Dashboard',  href: '/trainer/dashboard',  icon: LayoutDashboard },
  { label: 'My Members', href: '/trainer/members',     icon: Users           },
  { label: 'Attendance', href: '/trainer/attendance',  icon: CalendarDays    },
  { label: 'Schedule',   href: '/trainer/schedule',    icon: CalendarDays    },
];

function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
      background: active ? T.accentbg2 : 'transparent',
      border: `1px solid ${active ? T.accent : 'transparent'}`,
      transition: 'all .15s',
    }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.bg3; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={18} style={{ color: active ? T.accent : T.text2, flexShrink: 0 }} />
      <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: active ? 600 : 400, color: active ? T.accent : T.text2, whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
    </Link>
  );
}

export default function TrainerShell({ children }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const [profile,    setProfile]    = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('first_name, last_name, email')
        .eq('id', user.id).single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function isActive(href) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  const initials = profile
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
    : '?';

  const displayName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : 'Trainer';

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Barlow', sans-serif" }}>

      {/* Top navbar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40, height: 60,
        background: T.bg2, borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', gap: 12,
      }}>
        {/* Logo */}
        <Link href="/trainer/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Dumbbell size={16} color="#000" />
          </div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: T.text, lineHeight: 1 }}>
            IRON<span style={{ color: T.accent }}>FORGE</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 4 }}>
          {NAV.map((item) => (
            <NavItem key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>

        {/* Right — gym status + user pill + logout + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <GymStatusBar accentColor="#22c55e" />
          {/* Trainer badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: T.accentbg2, border: `1px solid ${T.accent}`, borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.accent }}>Trainer</span>
          </div>

          {/* User pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px 4px 4px', background: T.card, border: `1px solid ${T.border2}`, borderRadius: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: T.accentbg2, border: `1.5px solid ${T.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, fontWeight: 700, color: T.accent }}>
              {initials}
            </div>
            {!isMobile && (
              <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
            )}
          </div>

          {/* Logout */}
          <button onClick={handleLogout} title="Sign out"
            style={{ width: 36, height: 36, borderRadius: 8, background: 'transparent', border: `1px solid ${T.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text2, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text2; }}
          >
            <LogOut size={15} />
          </button>

          {/* Hamburger — mobile only */}
          <button onClick={() => setMobileOpen((p) => !p)}
            style={{ width: 36, height: 36, borderRadius: 8, background: 'transparent', border: `1px solid ${T.border2}`, display: isMobile ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', color: T.text2, cursor: 'pointer' }}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49, backdropFilter: 'blur(2px)' }}
          />
          <div style={{ position: 'fixed', top: 60, left: 0, right: 0, background: T.bg2, borderBottom: `1px solid ${T.border}`, padding: '12px 16px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV.map((item) => (
              <NavItem key={item.href} item={item} active={isActive(item.href)} onClick={() => setMobileOpen(false)} />
            ))}
          </div>
        </>
      )}

      {/* Main */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px 60px' }}>
        {children}
      </main>
    </div>
  );
}
