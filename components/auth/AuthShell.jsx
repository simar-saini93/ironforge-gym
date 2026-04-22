'use client';

import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

const FEATURES = [
  'Member & subscription management',
  'Smart QR + daily code door access',
  'CRM with lead pipeline',
  'Trainer scheduling & attendance',
  'Revenue & expiry reports',
];

export function AuthLogo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3 group"
      aria-label="IronForge Home"
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 36, height: 36, background: 'var(--if-accent)' }}
      >
        <Dumbbell size={17} color="#000" aria-hidden="true" />
      </div>
      <span
        className="font-bebas leading-none"
        style={{ fontSize: 22, letterSpacing: 3, color: 'var(--if-text)' }}
      >
        IRON<span style={{ color: 'var(--if-accent)' }}>FORGE</span>
      </span>
    </Link>
  );
}

function LeftPanel() {
  return (
    <aside
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--if-bg2)',
        borderRight: '1px solid var(--if-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Noise */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          top: -180,
          left: -180,
          width: 560,
          height: 560,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(circle, rgba(232,255,0,0.06) 0%, transparent 65%)',
        }}
      />

      {/* BG watermark */}
      <div
        className="font-bebas"
        style={{
          position: 'absolute',
          bottom: -30,
          right: -20,
          fontSize: 220,
          lineHeight: 1,
          letterSpacing: -4,
          color: 'rgba(232,255,0,0.03)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0,
        }}
      >
        IF
      </div>

      {/* Top — Logo */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '44px 40px 0',
        }}
      >
        <AuthLogo />
      </div>

      {/* Middle — RIGHT ALIGNED CONTENT */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 520,
            // marginLeft: 'auto',        // 🔥 pushes content to right
            padding: '40px 20px 40px 40px',
          }}
        >
          {/* Eyebrow */}
          <div
            className="font-condensed font-bold uppercase"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 11,
              letterSpacing: '0.35em',
              color: 'var(--if-accent)',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 28,
                height: 1,
                background: 'var(--if-accent)',
              }}
            />
            Management Portal
          </div>

          {/* Headline */}
          <h1
            className="font-bebas"
            style={{
              fontSize: 'clamp(60px, 5.5vw, 90px)',
              lineHeight: 0.88,
              letterSpacing: 1,
              marginBottom: 24,
            }}
          >
            FORGE<br />YOUR<br />
            <span
              style={{
                WebkitTextStroke: '1px rgba(240,240,240,0.28)',
                color: 'transparent',
              }}
            >
              LEGACY
            </span>
          </h1>

          {/* Description */}
          <p
            className="font-barlow font-light"
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: 'var(--if-mid)',
              marginBottom: 28,
              maxWidth: 420,
            }}
          >
            Complete gym management — members, trainers, subscriptions, CRM and
            smart access control, all in one place.
          </p>

          {/* Features */}
          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {FEATURES.map((f) => (
              <li
                key={f}
                className="font-condensed font-semibold uppercase"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 16,
                  letterSpacing: '0.06em',
                  color: 'var(--if-mid)',
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: 'var(--if-accent)',
                  }}
                />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '0 40px 44px',
        }}
      >
        <p
          className="font-condensed uppercase"
          style={{
            fontSize: 14,
            letterSpacing: '0.2em',
            color: 'var(--if-muted)',
          }}
        >
          © {new Date().getFullYear()} IronForge Gym. All rights reserved.
        </p>
      </div>
    </aside>
  );
}

export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex bg-[var(--if-bg)] text-[var(--if-text)]">
      
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-1">
        <LeftPanel />
      </div>

      {/* RIGHT PANEL */}
      <main className="flex-1 flex items-center justify-center px-6 lg:px-16">
        <div className="w-full max-w-[520px]">
          {children}
        </div>
      </main>

    </div>
  );
}
