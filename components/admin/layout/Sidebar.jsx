'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays,
  LayoutDashboard, Users, Dumbbell, CreditCard, Banknote,
  Target, DoorOpen, ClipboardList, BarChart2, Settings,
} from 'lucide-react';

// ── Nav config ───────────────────────────────────────────────
const NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Reports',   href: '/admin/reports',   icon: BarChart2       },
    ],
  },
  {
    section: 'People',
    items: [
      { label: 'Members',  href: '/admin/members',  icon: Users    },
      { label: 'Trainers', href: '/admin/trainers', icon: Dumbbell },
    ],
  },
  {
    section: 'Finance',
    items: [
      { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
      { label: 'Payments',      href: '/admin/payments',      icon: Banknote   },
    ],
  },
  {
    section: 'Operations',
    items: [
      { label: 'CRM / Leads', href: '/admin/crm',         icon: Target        },
      { label: 'Schedule',    href: '/admin/schedule',  icon: CalendarDays, group: 'OPERATIONS' },
  { label: 'Access Logs', href: '/admin/access-logs', icon: DoorOpen      },
      { label: 'Audit Trail', href: '/admin/audit',       icon: ClipboardList },
    ],
  },
];

const BOTTOM_NAV = [
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export const SIDEBAR_EXPANDED  = 240;
export const SIDEBAR_COLLAPSED = 60;

// ── Single nav item ──────────────────────────────────────────
function NavItem({ item, collapsed, active, onNavigate }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            collapsed ? 0 : 10,
        padding:        collapsed ? '8px 0' : '8px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius:   8,
        marginBottom:   2,
        position:       'relative',
        background:     active ? 'var(--if-accentbg2)' : 'transparent',
        textDecoration: 'none',
        transition:     'background .15s',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--if-card2)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? 'var(--if-accentbg2)' : 'transparent'; }}
    >
      {/* Active bar */}
      {active && (
        <div style={{
          position:    'absolute', left: 0, top: '50%',
          transform:   'translateY(-50%)',
          width:       3, height: 20,
          background:  'var(--if-accent)',
          borderRadius:'0 2px 2px 0',
        }} />
      )}

      {/* Icon box */}
      <div style={{
        width:          30, height: 30,
        borderRadius:   8,
        background:     active ? 'var(--if-accentbg2)' : 'var(--if-bg3)',
        display:        'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink:     0,
        color:          active ? 'var(--if-accent)' : 'var(--if-text2)',
        transition:     'all .15s',
      }}>
        <Icon size={16} />
      </div>

      {/* Label */}
      {!collapsed && (
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize:   16, fontWeight: active ? 600 : 500,
          color:      active ? 'var(--if-accent)' : 'var(--if-text2)',
          flex:       1, transition: 'color .15s', whiteSpace: 'nowrap',
        }}>
          {item.label}
        </span>
      )}

      {/* Tooltip on collapsed */}
      {collapsed && (
        <div
          className="nav-tooltip"
          style={{
            position:      'absolute', left: '100%', marginLeft: 12,
            padding:       '6px 12px', borderRadius: 8,
            background:    'var(--if-card2)', border: '1px solid var(--if-border2)',
            color:         'var(--if-text)',
            fontFamily:    "'Outfit', sans-serif",
            fontSize:      13, fontWeight: 600,
            whiteSpace:    'nowrap', opacity: 0, pointerEvents: 'none',
            zIndex:        50, boxShadow: '0 4px 16px rgba(0,0,0,.3)',
            transition:    'opacity .15s',
          }}
        >
          {item.label}
        </div>
      )}
    </Link>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────
export default function Sidebar({ collapsed, onNavigate }) {
  const pathname = usePathname();

  function isActive(href) {
    if (href === '/admin/dashboard') return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <style>{`a:hover .nav-tooltip { opacity: 1 !important; }`}</style>

      <aside style={{
        width:          collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
        height:         '100%',
        background:     'var(--if-bg2)',
        borderRight:    '1px solid var(--if-border)',
        display:        'flex', flexDirection: 'column',
        flexShrink:     0,
        transition:     'width .3s cubic-bezier(.4,0,.2,1)',
        overflow:       'hidden',
      }}>

        {/* ── Logo ── */}
        <div style={{
          height:       60,
          padding:      collapsed ? '0 15px' : '0 18px',
          display:      'flex', alignItems: 'center',
          gap:          collapsed ? 0 : 10,
          borderBottom: '1px solid var(--if-border)',
          flexShrink:   0, overflow: 'hidden',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--if-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Dumbbell size={16} color="#000" />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{
                fontFamily:    "'Outfit', sans-serif",
                fontSize:      16, fontWeight: 800,
                letterSpacing: '.02em', color: 'var(--if-text)',
                lineHeight:    1, whiteSpace: 'nowrap',
              }}>
                Iron<span style={{ color: 'var(--if-accent)' }}>Forge</span>
              </p>
              <p style={{
                fontFamily:    "'Outfit', sans-serif",
                fontSize:      9, fontWeight: 500,
                letterSpacing: '.14em', textTransform: 'uppercase',
                color:         'var(--if-muted)', marginTop: 2, whiteSpace: 'nowrap',
              }}>
                Management
              </p>
            </div>
          )}
        </div>

        {/* ── Nav ── */}
        <nav style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: collapsed ? '12px 8px' : '12px 12px',
        }}>
          {NAV.map((group) => (
            <div key={group.section} style={{ marginBottom: 14 }}>
              {!collapsed ? (
                <p style={{
                  fontFamily:    "'Outfit', sans-serif",
                  fontSize:      11, fontWeight: 700,
                  letterSpacing: '.2em', textTransform: 'uppercase',
                  color:         'var(--if-muted)',
                  padding:       '0 10px', marginBottom: 4,
                }}>
                  {group.section}
                </p>
              ) : (
                <div style={{ height: 1, background: 'var(--if-border)', margin: '0 4px 8px' }} />
              )}
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  active={isActive(item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ))}

          <div style={{ height: 1, background: 'var(--if-border)', margin: '4px 0 14px' }} />

          {BOTTOM_NAV.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
