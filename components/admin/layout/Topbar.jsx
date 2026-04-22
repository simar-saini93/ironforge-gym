'use client';

import { Sun, Moon, Search, Menu, X, LogOut } from 'lucide-react';
import dynamic from 'next/dynamic';

const NotificationBell = dynamic(() => import('@/components/admin/layout/NotificationBell'), {
  ssr: false,
  loading: () => <div style={{ width: 36, height: 36 }} />,
});

const SearchBar = dynamic(() => import('@/components/admin/layout/SearchBar'), {
  ssr: false,
  loading: () => <div style={{ width: 240, height: 36, background: 'var(--if-card)', border: '1px solid var(--if-border2)', borderRadius: 8 }} />,
});
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/admin/layout/ThemeProvider';
import { createClient } from '@/lib/supabase/client';

export default function Topbar({
  title, subtitle, actions, profile,
  sidebarCollapsed, onToggleSidebar,
  mobileMenuOpen, onToggleMobileMenu,
}) {
  const { theme, toggleTheme } = useTheme();
  const router   = useRouter();
  const supabase = createClient();

  const initials = profile
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
    : 'SA';

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : 'Super Admin';

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const iconBtnStyle = {
    width:        36, height: 36,
    background:   'var(--if-card)',
    border:       '1px solid var(--if-border2)',
    borderRadius: 8,
    display:      'flex', alignItems: 'center', justifyContent: 'center',
    cursor:       'pointer', color: 'var(--if-text2)',
    flexShrink:   0, transition: 'all .18s',
  };

  return (
    <header style={{
      height:         60,
      background:     'var(--if-bg2)',
      borderBottom:   '1px solid var(--if-border)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '0 20px',
      flexShrink:     0,
      gap:            12,
      position:       'sticky',
      top:            0,
      zIndex:         40,
    }}>

      {/* ── Left — hamburger + title ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>

        {/* Desktop hamburger — toggles collapse, hidden on mobile */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex items-center justify-center"
          style={{
            width: 36, height: 36,
            background:   'var(--if-card)',
            border:       '1px solid var(--if-border2)',
            borderRadius: 8,
            cursor:       'pointer',
            color:        'var(--if-text2)',
            flexShrink:   0,
            transition:   'all .18s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={17} />
        </button>

        {/* Mobile hamburger — toggles drawer, hidden on desktop */}
        <button
          onClick={onToggleMobileMenu}
          className="flex lg:hidden items-center justify-center"
          style={{
            width: 36, height: 36,
            background:   'var(--if-card)',
            border:       '1px solid var(--if-border2)',
            borderRadius: 8,
            cursor:       'pointer',
            color:        'var(--if-text2)',
            flexShrink:   0,
            transition:   'all .18s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>

        {/* Page title */}
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontFamily:    "'Outfit', sans-serif",
            fontSize:      16, fontWeight: 700,
            letterSpacing: '-.01em',
            color:         'var(--if-text)', lineHeight: 1,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p
              className="hidden md:block"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize:   14, fontWeight: 400,
                color:      'var(--if-muted)', marginTop: 2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Right ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

        {/* Search — dynamically loaded to keep bundle light */}
        <div className="hidden md:block">
          <SearchBar />
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={iconBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-accent)'; e.currentTarget.style.color = 'var(--if-accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; }}
          aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Custom page actions */}
        {actions}

        {/* ── User pill ── */}
        <div style={{
          display:      'flex', alignItems: 'center', gap: 8,
          padding:      '3px 10px 3px 3px',
          borderRadius: 8,
          background:   'var(--if-card)',
          border:       '1px solid var(--if-border2)',
          flexShrink:   0, position: 'relative',
          transition:   'border-color .18s', cursor: 'default',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--if-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--if-border2)')}
        >
          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--if-accentbg2)', border: '1.5px solid var(--if-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif",
            fontSize: 10, fontWeight: 800, color: 'var(--if-accent)', flexShrink: 0,
          }}>
            {initials}
          </div>

          {/* Name + role — hidden on small screens */}
          <div className="hidden sm:flex" style={{ flexDirection: 'column' }}>
            <span style={{
              fontFamily:  "'Outfit', sans-serif",
              fontSize:    12, fontWeight: 700,
              color:       'var(--if-text)', lineHeight: 1.3, whiteSpace: 'nowrap',
            }}>
              {displayName}
            </span>
            <span style={{
              fontSize:      9, fontWeight: 600,
              color:         'var(--if-accent)',
              letterSpacing: '.04em', textTransform: 'uppercase',
              fontFamily:    "'Outfit', sans-serif",
            }}>
              Super Admin
            </span>
          </div>

          {/* Online dot */}
          <div style={{
            position: 'absolute', top: 3, right: 3,
            width: 6, height: 6, background: 'var(--if-green)',
            borderRadius: '50%', border: '1.5px solid var(--if-bg2)',
          }} />
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          style={iconBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--if-red)'; e.currentTarget.style.color = 'var(--if-red)'; e.currentTarget.style.background = 'var(--if-redbg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--if-border2)'; e.currentTarget.style.color = 'var(--if-text2)'; e.currentTarget.style.background = 'var(--if-card)'; }}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
