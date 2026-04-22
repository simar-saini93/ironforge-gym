'use client';

import dynamic from 'next/dynamic';
const GymStatusBar = dynamic(() => import('@/components/shared/GymStatusBar'), { ssr: false });

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, Banknote,
  CalendarDays, Dumbbell, LogOut, Menu, X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ── Design tokens — member portal uses landing page yellow ──
const M = {
  bg:       '#080808',
  bg2:      '#0e0e0e',
  bg3:      '#141414',
  card:     '#111111',
  card2:    '#1a1a1a',
  border:   '#1f1f1f',
  border2:  '#2a2a2a',
  text:     '#f0f0f0',
  text2:    '#888888',
  muted:    '#444444',
  accent:   '#E8FF00',   // ← landing page yellow
  accentbg: 'rgba(232,255,0,0.08)',
  accentbg2:'rgba(232,255,0,0.14)',
  green:    '#22c55e',
  red:      '#ef4444',
};

const NAV = [
  { label: 'Dashboard',    href: '/member/dashboard',    icon: LayoutDashboard },
  { label: 'Subscription', href: '/member/subscription', icon: CreditCard      },
  { label: 'Payments',     href: '/member/payments',     icon: Banknote        },
  { label: 'Attendance',   href: '/member/attendance',   icon: CalendarDays    },
  { label: 'My Trainer',   href: '/member/trainer',      icon: Dumbbell        },
];

function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            10,
        padding:        '10px 14px',
        borderRadius:   10,
        textDecoration: 'none',
        background:     active ? M.accentbg2 : 'transparent',
        border:         `1px solid ${active ? M.accent : 'transparent'}`,
        transition:     'all .15s',
        position:       'relative',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = M.bg3; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon
        size={18}
        style={{ color: active ? M.accent : M.text2, flexShrink: 0 }}
      />
      <span style={{
        fontFamily:  "'Barlow', sans-serif",
        fontSize:    14,
        fontWeight:  active ? 600 : 400,
        color:       active ? M.accent : M.text2,
        whiteSpace:  'nowrap',
      }}>
        {item.label}
      </span>
    </Link>
  );
}

export default function MemberShell({ children }) {
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
      supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  // Close mobile nav on resize
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
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
    : 'Member';

  return (
    <div style={{
      minHeight:  '100vh',
      background: M.bg,
      color:      M.text,
      fontFamily: "'Barlow', sans-serif",
    }}>

      {/* ── Top navbar ── */}
      <header style={{
        position:     'sticky', top: 0, zIndex: 40,
        height:       60,
        background:   M.bg2,
        borderBottom: `1px solid ${M.border}`,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        padding:      '0 20px',
        gap:          12,
      }}>
        {/* Logo */}
        <Link href="/member/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: M.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Dumbbell size={16} color="#000" />
          </div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: M.text, lineHeight: 1 }}>
            IRON<span style={{ color: M.accent }}>FORGE</span>
          </span>
        </Link>

        {/* Desktop nav — center, hidden on mobile */}
        <nav style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 4 }}>
          {NAV.map((item) => (
            <NavItem key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </nav>

        {/* Right — gym status + user + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <GymStatusBar accentColor="#E8FF00" />
          {/* User pill */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            padding:      '4px 12px 4px 4px',
            background:   M.card,
            border:       `1px solid ${M.border2}`,
            borderRadius: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: M.accentbg2,
              border:     `1.5px solid ${M.accent}`,
              display:    'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize:   11, fontWeight: 700, color: M.accent,
            }}>
              {initials}
            </div>
            <span className="hidden sm:block" style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize:   13, fontWeight: 600, color: M.text,
              whiteSpace: 'nowrap',
            }}>
              {displayName}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'transparent',
              border:     `1px solid ${M.border2}`,
              display:    'flex', alignItems: 'center', justifyContent: 'center',
              color:      M.text2, cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = M.red; e.currentTarget.style.color = M.red; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = M.border2; e.currentTarget.style.color = M.text2; }}
          >
            <LogOut size={15} />
          </button>

          {/* Mobile menu toggle — only on mobile */}
          <button
            onClick={() => setMobileOpen((p) => !p)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'transparent',
              border:     `1px solid ${M.border2}`,
              display:    isMobile ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center',
              color:      M.text2, cursor: 'pointer',
            }}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* ── Mobile nav drawer ── */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49, backdropFilter: 'blur(2px)' }}
          />
          <div style={{
            position:  'fixed', top: 60, left: 0, right: 0,
            background: M.bg2,
            borderBottom: `1px solid ${M.border}`,
            padding:   '12px 16px',
            zIndex:    50,
            display:   'flex', flexDirection: 'column', gap: 4,
          }}>
            {NAV.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Main content ── */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px 60px' }}>
        {children}
      </main>
    </div>
  );
}
