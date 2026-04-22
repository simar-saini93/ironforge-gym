'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowLeft, Dumbbell } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#080808',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px',
      fontFamily:     "'Barlow', sans-serif",
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#E8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Dumbbell size={18} color="#000" />
        </div>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: '#f0f0f0' }}>
          IRON<span style={{ color: '#E8FF00' }}>FORGE</span>
        </span>
      </Link>

      {/* Card */}
      <div style={{
        width:        '100%',
        maxWidth:     480,
        background:   '#111111',
        border:       '1px solid #1f1f1f',
        borderRadius: 16,
        padding:      '48px 40px',
        textAlign:    'center',
      }}>
        {/* Icon */}
        <div style={{
          width:          72, height: 72,
          borderRadius:   16,
          background:     'rgba(232,255,0,0.12)',
          border:         '2px solid #E8FF00',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          margin:         '0 auto 24px',
        }}>
          <CheckCircle2 size={32} color="#E8FF00" />
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily:    "'Bebas Neue', sans-serif",
          fontSize:      40, letterSpacing: 2,
          color:         '#f0f0f0', lineHeight: 1,
          marginBottom:  12,
        }}>
          We Got Your Message!
        </h1>

        <p style={{ fontSize: 15, color: '#888888', lineHeight: 1.7, marginBottom: 28 }}>
          Thanks for reaching out. Our team will contact you within <strong style={{ color: '#f0f0f0' }}>24 hours</strong> to discuss your membership options.
        </p>

        {/* Confirmation email note */}
        <div style={{
          background:   'rgba(232,255,0,0.06)',
          border:       '1px solid rgba(232,255,0,0.2)',
          borderRadius: 10,
          padding:      '14px 18px',
          marginBottom: 32,
          textAlign:    'left',
        }}>
          <p style={{ fontSize: 13, color: '#888888', lineHeight: 1.6, margin: 0 }}>
            📧 <strong style={{ color: '#f0f0f0' }}>Check your inbox</strong> — we've sent a confirmation email with details about what to expect next.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36, textAlign: 'left' }}>
          {[
            'Our team will call or message you',
            'We\'ll discuss the best plan for your goals',
            'Schedule a free gym tour',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: '#E8FF00', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 12, color: '#000', fontWeight: 700,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 14, color: '#888888' }}>{step}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            8,
            height:         46,
            padding:        '0 28px',
            borderRadius:   10,
            background:     '#E8FF00',
            color:          '#000',
            fontFamily:     "'Barlow Condensed', sans-serif",
            fontSize:       14,
            fontWeight:     700,
            letterSpacing:  '.1em',
            textTransform:  'uppercase',
            textDecoration: 'none',
            transition:     'all .18s',
          }}
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 32, fontSize: 12, color: '#444444' }}>
        © {new Date().getFullYear()} IronForge Gym. All rights reserved.
      </p>
    </div>
  );
}
