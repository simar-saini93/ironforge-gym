'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  label, error, hint, required = false,
  options = [], placeholder = 'Select option',
  id, value, onChange, className = '', ...props
}) {
  const [focused, setFocused] = useState(false);
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const borderColor = error
    ? 'var(--if-red)'
    : focused ? 'var(--if-accent)' : 'var(--if-border2)';

  const boxShadow = error
    ? '0 0 0 3px var(--if-redbg)'
    : focused ? '0 0 0 3px var(--if-accentbg)' : 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} className={className}>
      {label && (
        <label htmlFor={selectId} style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 11, fontWeight: 700,
          letterSpacing: '.15em', textTransform: 'uppercase',
          color: error ? 'var(--if-red)' : 'var(--if-text2)',
        }}>
          {label}
          {required && <span style={{ color: 'var(--if-red)', marginLeft: 3 }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          style={{
            width:        '100%', height: 40,
            background:   'var(--if-card)',
            border:       `1px solid ${borderColor}`,
            boxShadow,
            borderRadius: 8,
            padding:      '0 36px 0 12px',
            fontFamily:   "'DM Sans', sans-serif",
            fontSize:     14, fontWeight: 400,
            color:        value ? 'var(--if-text)' : 'var(--if-muted)',
            outline:      'none', cursor: 'pointer',
            appearance:   'none', transition: 'border-color .15s, box-shadow .15s',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        >
          <option value="" disabled style={{ color: 'var(--if-muted)' }}>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{ background: 'var(--if-card)', color: 'var(--if-text)' }}
            >
              {opt.label}
            </option>
          ))}
        </select>
        <div style={{
          position: 'absolute', right: 10, top: '50%',
          transform: 'translateY(-50%)',
          color: focused ? 'var(--if-accent)' : 'var(--if-muted)',
          pointerEvents: 'none', transition: 'color .15s',
        }}>
          <ChevronDown size={15} />
        </div>
      </div>

      {error && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-red)' }}>
          {error}
        </p>
      )}
      {!error && hint && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--if-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}