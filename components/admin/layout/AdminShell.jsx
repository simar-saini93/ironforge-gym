'use client';
import CurrencyProvider from '@/components/shared/CurrencyProvider';

import { useState, useEffect, useRef } from 'react';
import Sidebar           from '@/components/admin/layout/Sidebar';
import Topbar            from '@/components/admin/layout/Topbar';
import AdminThemeProvider from '@/components/admin/layout/ThemeProvider';
import { createClient } from '@/lib/supabase/client';

function Shell({ children, topbarProps }) {
  const supabase = createClient();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false);
  const [profile,          setProfile]          = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('if-sidebar-collapsed');
    if (saved === 'true') setSidebarCollapsed(true);

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('first_name, last_name, email, role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

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
