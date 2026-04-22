'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open, onClose, title, children,
  size = 'md', footer,
}) {
  const widths = { sm: 440, md: 560, lg: 720, xl: 900 };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Return null AFTER hooks
  if (!open) return null;

  return (
    <div
      style={{
        position:        'fixed', inset: 0, zIndex: 200,
        display:         'flex', alignItems: 'center', justifyContent: 'center',
        padding:         '24px 16px',
        background:      'rgba(0,0,0,0.7)',
        backdropFilter:  'blur(4px)',
        animation:       'fadeIn .15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <div
        style={{
          width:         '100%',
          maxWidth:      widths[size] || widths.md,
          maxHeight:     '90vh',
          background:    'var(--if-card)',
          border:        '1px solid var(--if-border)',
          borderRadius:  12,
          display:       'flex',
          flexDirection: 'column',
          animation:     'slideUp .2s ease',
          overflow:      'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display:       'flex', alignItems: 'center', justifyContent: 'space-between',
          padding:       '16px 20px',
          borderBottom:  '1px solid var(--if-border)',
          flexShrink:    0,
        }}>
          <h2 style={{
            fontFamily:    "'Outfit', sans-serif",
            fontSize:      16, fontWeight: 700,
            color:         'var(--if-text)', letterSpacing: '-.01em',
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 7,
              background: 'transparent', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--if-muted)', cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--if-card2)'; e.currentTarget.style.color = 'var(--if-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--if-muted)'; }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding:      '14px 20px',
            borderTop:    '1px solid var(--if-border)',
            display:      'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap:          8, flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
