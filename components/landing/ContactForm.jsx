'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: '',
    last_name:  '',
    email:      '',
    phone:      '',
    message:    '',
    source:     'website',
  });
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function onChange(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Name is required';
    if (!form.phone.trim())      e.phone      = 'Phone is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/leads/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrors({ submit: json.error || 'Something went wrong. Please try again.' });
        return;
      }

      router.push('/thank-you');

    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width:        '100%',
    height:       48,
    background:   '#111111',
    border:       '1px solid #2a2a2a',
    borderRadius: 0,
    padding:      '0 16px',
    fontFamily:   "'Barlow', sans-serif",
    fontSize:     14,
    color:        '#f0f0f0',
    outline:      'none',
    transition:   'border-color .2s',
  };

  const labelStyle = {
    fontFamily:    "'Barlow Condensed', sans-serif",
    fontSize:      11,
    fontWeight:    700,
    letterSpacing: '.15em',
    textTransform: 'uppercase',
    color:         '#888888',
    display:       'block',
    marginBottom:  6,
  };

  const errorStyle = {
    fontFamily: "'Barlow', sans-serif",
    fontSize:   12,
    color:      '#ef4444',
    marginTop:  4,
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Name row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>First Name *</label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => onChange('first_name', e.target.value)}
              placeholder="John"
              style={{ ...inputStyle, borderColor: errors.first_name ? '#ef4444' : '#2a2a2a' }}
              onFocus={(e) => { e.target.style.borderColor = '#E8FF00'; }}
              onBlur={(e)  => { e.target.style.borderColor = errors.first_name ? '#ef4444' : '#2a2a2a'; }}
            />
            {errors.first_name && <p style={errorStyle}>{errors.first_name}</p>}
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => onChange('last_name', e.target.value)}
              placeholder="Doe"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#E8FF00'; }}
              onBlur={(e)  => { e.target.style.borderColor = '#2a2a2a'; }}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label style={labelStyle}>Phone Number *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+91 98765 43210"
            style={{ ...inputStyle, borderColor: errors.phone ? '#ef4444' : '#2a2a2a' }}
            onFocus={(e) => { e.target.style.borderColor = '#E8FF00'; }}
            onBlur={(e)  => { e.target.style.borderColor = errors.phone ? '#ef4444' : '#2a2a2a'; }}
          />
          {errors.phone && <p style={errorStyle}>{errors.phone}</p>}
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="john@email.com"
            style={{ ...inputStyle, borderColor: errors.email ? '#ef4444' : '#2a2a2a' }}
            onFocus={(e) => { e.target.style.borderColor = '#E8FF00'; }}
            onBlur={(e)  => { e.target.style.borderColor = errors.email ? '#ef4444' : '#2a2a2a'; }}
          />
          {errors.email && <p style={errorStyle}>{errors.email}</p>}
        </div>

        {/* How did you hear */}
        <div>
          <label style={labelStyle}>How did you hear about us?</label>
          <select
            value={form.source}
            onChange={(e) => onChange('source', e.target.value)}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            onFocus={(e) => { e.target.style.borderColor = '#E8FF00'; }}
            onBlur={(e)  => { e.target.style.borderColor = '#2a2a2a'; }}
          >
            <option value="website">Website</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="google">Google</option>
            <option value="referral">Referral</option>
            <option value="walk_in">Walk-in</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label style={labelStyle}>Message</label>
          <textarea
            value={form.message}
            onChange={(e) => onChange('message', e.target.value)}
            placeholder="Tell us about your fitness goals..."
            rows={3}
            style={{
              ...inputStyle,
              height:  'auto',
              padding: '12px 16px',
              resize:  'vertical',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#E8FF00'; }}
            onBlur={(e)  => { e.target.style.borderColor = '#2a2a2a'; }}
          />
        </div>

        {/* Submit error */}
        {errors.submit && (
          <p style={{ ...errorStyle, textAlign: 'center', padding: '10px', background: 'rgba(239,68,68,0.09)', border: '1px solid #ef4444' }}>
            {errors.submit}
          </p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width:         '100%',
            height:        52,
            background:    loading ? '#2a2a2a' : '#E8FF00',
            color:         loading ? '#555' : '#000',
            border:        'none',
            borderRadius:  0,
            fontFamily:    "'Barlow Condensed', sans-serif",
            fontSize:      14,
            fontWeight:    700,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            cursor:        loading ? 'not-allowed' : 'pointer',
            transition:    'all .2s',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            gap:           8,
          }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = loading ? '#2a2a2a' : '#E8FF00'; e.currentTarget.style.transform = 'none'; }}
        >
          {loading ? 'Submitting...' : 'Send Enquiry →'}
        </button>

        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: '#444', textAlign: 'center' }}>
          We'll get back to you within 24 hours.
        </p>
      </div>
    </form>
  );
}