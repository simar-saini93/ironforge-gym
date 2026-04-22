'use client';

import { useState } from 'react';

/**
 * Input
 * @param {string}  label
 * @param {string}  error
 * @param {string}  hint
 * @param {ReactNode} leftIcon
 * @param {ReactNode} rightSlot
 * @param {boolean} required
 */
export default function Input({
  label,
  error,
  hint,
  leftIcon,
  rightSlot,
  required = false,
  id,
  className = '',
  ...props
}) {
  const [focused, setFocused] = useState(false);

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const borderColor = error
    ? 'var(--if-red)'
    : focused
    ? 'var(--if-accent)'
    : 'var(--if-border2)';

  const boxShadow = error
    ? '0 0 0 3px var(--if-redbg)'
    : focused
    ? '0 0 0 3px var(--if-accentbg)'
    : 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} className={className}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily:    "'Outfit', sans-serif",
            fontSize:      11,
            fontWeight:    700,
            letterSpacing: '.15em',
            textTransform: 'uppercase',
            color:         error ? 'var(--if-red)' : 'var(--if-text2)',
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--if-red)', marginLeft: 3 }}>*</span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Left icon */}
        {leftIcon && (
          <div style={{
            position:       'absolute', left: 12,
            display:        'flex', alignItems: 'center',
            color:          focused ? 'var(--if-accent)' : 'var(--if-muted)',
            pointerEvents:  'none', zIndex: 1,
            transition:     'color .15s',
          }}>
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          style={{
            width:        '100%',
            height:       40,
            background:   'var(--if-card)',
            border:       `1px solid ${borderColor}`,
            boxShadow,
            borderRadius: 8,
            padding:      `0 ${rightSlot ? '40px' : '12px'} 0 ${leftIcon ? '38px' : '12px'}`,
            fontFamily:   "'DM Sans', sans-serif",
            fontSize:     14,
            fontWeight:   400,
            color:        'var(--if-text)',
            outline:      'none',
            transition:   'border-color .15s, box-shadow .15s',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />

        {/* Right slot */}
        {rightSlot && (
          <div style={{
            position:      'absolute', right: 10,
            display:       'flex', alignItems: 'center',
          }}>
            {rightSlot}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize:   12, fontWeight: 400,
          color:      'var(--if-red)',
        }}>
          {error}
        </p>
      )}

      {/* Hint */}
      {!error && hint && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize:   12, fontWeight: 400,
          color:      'var(--if-muted)',
        }}>
          {hint}
        </p>
      )}
    </div>
  );
}