'use client';

import { Loader2 } from 'lucide-react';

/**
 * Button
 * @param {'primary'|'ghost'|'danger'|'outline'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {boolean} disabled
 * @param {ReactNode} icon
 * @param {'left'|'right'} iconPosition
 */
export default function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  icon,
  iconPosition = 'left',
  onClick,
  type      = 'button',
  fullWidth = false,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  const sizes = {
    sm: { height: 32, fontSize: 12, padding: '0 12px', gap: 6,  iconSize: 13 },
    md: { height: 38, fontSize: 13, padding: '0 16px', gap: 7,  iconSize: 15 },
    lg: { height: 44, fontSize: 14, padding: '0 20px', gap: 8,  iconSize: 16 },
  };

  const variants = {
    primary: {
      background:  'var(--if-accent)',
      color:       '#000',
      border:      'none',
      hoverBg:     'var(--if-accent-h)',
    },
    ghost: {
      background:  'transparent',
      color:       'var(--if-text2)',
      border:      '1px solid var(--if-border2)',
      hoverBg:     'var(--if-card2)',
    },
    outline: {
      background:  'transparent',
      color:       'var(--if-accent)',
      border:      '1px solid var(--if-accent)',
      hoverBg:     'var(--if-accentbg)',
    },
    danger: {
      background:  'transparent',
      color:       'var(--if-red)',
      border:      '1px solid var(--if-border2)',
      hoverBg:     'var(--if-redbg)',
    },
  };

  const s = sizes[size]   || sizes.md;
  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={className}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            s.gap,
        height:         s.height,
        padding:        s.padding,
        fontSize:       s.fontSize,
        fontFamily:     "'Outfit', sans-serif",
        fontWeight:     600,
        letterSpacing:  '.01em',
        borderRadius:   8,
        cursor:         isDisabled ? 'not-allowed' : 'pointer',
        opacity:        isDisabled ? 0.5 : 1,
        transition:     'all .18s',
        whiteSpace:     'nowrap',
        flexShrink:     0,
        width:          fullWidth ? '100%' : undefined,
        background:     v.background,
        color:          v.color,
        border:         v.border || 'none',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.background = v.hoverBg;
          e.currentTarget.style.transform  = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = v.background;
        e.currentTarget.style.transform  = 'none';
      }}
      {...props}
    >
      {loading && <Loader2 size={s.iconSize} className="animate-spin" />}
      {!loading && icon && iconPosition === 'left' && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
      )}
    </button>
  );
}