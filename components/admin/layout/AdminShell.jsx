'use client';

import { useState, useEffect }   from 'react';
import CurrencyProvider          from '@/components/shared/CurrencyProvider';
import Sidebar                   from '@/components/admin/layout/Sidebar';
import Topbar                    from '@/components/admin/layout/Topbar';
import AdminThemeProvider        from '@/components/admin/layout/ThemeProvider';

function Shell({ children, topbarProps }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false);
  const [profile,          setProfile]          = useState(null);

  // ── Sidebar collapse state ────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('if-sidebar-collapsed');
    if (saved === 'true') setSidebarCollapsed(true);
  }, []);

  // ── Load profile via Drizzle API ──────────────────────────
  useEffect(() => {
    fetch('/api/admin/profile')
      .then((r) => r.json())
      .then(({ profile }) => { if (profile) setProfile(profile); })
      .catch((err) => console.error('[AdminShell] profile fetch:', err));
  }, []);

  // ── Close mobile menu on resize ───────────────────────────
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handleToggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('if-sidebar-collapsed', String(next));
      return next;
    });
  }

  return (
    <CurrencyProvider>
      <div style={{
        display: 'flex', height: '100vh', overflow: 'hidden',
        background: 'var(--if-bg)', color: 'var(--if-text)',
        fontFamily: "'DM Sans', sans-serif", position: 'relative',
      }}>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex" style={{ height: '100vh', flexShrink: 0 }}>
          <Sidebar collapsed={sidebarCollapsed} onNavigate={() => {}} />
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 49, backdropFilter: 'blur(2px)',
              }}
            />
            <div
              className="flex lg:hidden"
              style={{
                position: 'fixed', top: 0, left: 0,
                height: '100vh', zIndex: 50,
                animation: 'slideIn .25s ease',
              }}
            >
              <style>{`
                @keyframes slideIn {
                  from { transform: translateX(-100%); opacity: 0; }
                  to   { transform: translateX(0);     opacity: 1; }
                }
              `}</style>
              <Sidebar
                collapsed={false}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          </>
        )}

        {/* Main */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          flex: 1, minWidth: 0, height: '100vh', overflow: 'hidden',
        }}>
          <Topbar
            {...topbarProps}
            profile={profile}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={handleToggleSidebar}
            mobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={() => setMobileMenuOpen((p) => !p)}
          />
          <main
            id="main-content"
            style={{ flex: 1, overflowY: 'auto', padding: '22px 24px 40px' }}
          >
            {children}
          </main>
        </div>
      </div>
    </CurrencyProvider>
  );
}

export default function AdminShell({ children, topbarProps }) {
  return (
    <AdminThemeProvider>
      <Shell topbarProps={topbarProps}>
        {children}
      </Shell>
    </AdminThemeProvider>
  );
}
