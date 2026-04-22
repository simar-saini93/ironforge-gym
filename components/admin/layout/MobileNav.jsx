'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Target, CreditCard, Settings,
} from 'lucide-react';

const MOBILE_NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Members',   href: '/admin/members',   icon: Users           },
  { label: 'CRM',       href: '/admin/crm',        icon: Target          },
  { label: 'Finance',   href: '/admin/payments',   icon: CreditCard      },
  { label: 'Settings',  href: '/admin/settings',   icon: Settings        },
];

export default function MobileNav() {
  const pathname = usePathname();

  function isActive(href) {
    if (href === '/admin/dashboard') return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-center"
      style={{
        height:    60,
        background:'var(--if-bg2)',
        borderTop: '1px solid var(--if-border)',
      }}
      aria-label="Mobile navigation"
    >
      {MOBILE_NAV.map((item) => {
        const Icon   = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150"
            style={{ color: active ? 'var(--if-accent)' : 'var(--if-muted)' }}
          >
            <Icon size={20} />
            <span
              style={{
                fontFamily:    "'Outfit', sans-serif",
                fontSize:      9,
                fontWeight:    600,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}