'use client';

import { useState, useEffect } from 'react';
import { Dumbbell, Phone, Mail, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const M = {
  accent: '#E8FF00', accentbg2: 'rgba(232,255,0,0.14)',
  card: '#111111', card2: '#1a1a1a', border: '#1f1f1f', border2: '#2a2a2a',
  text: '#f0f0f0', text2: '#888888', muted: '#444444',
};

export default function MemberTrainer() {
  const supabase = createClient();
  const [trainer,  setTrainer]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: member }   = await supabase.from('members').select('id').eq('profile_id', user.id).single();
      if (!member) { setLoading(false); return; }

      const { data } = await supabase
        .from('member_trainer_assignments')
        .select(`
          assigned_at,
          trainer:trainers(
            specialization, bio,
            profile:profiles(first_name, last_name, email, phone)
          )
        `)
        .eq('member_id', member.id)
        .eq('is_active', true)
        .single();

      setTrainer(data?.trainer || null);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: M.text2 }}>Loading...</div>;

  const name = trainer
    ? `${trainer.profile?.first_name || ''} ${trainer.profile?.last_name || ''}`.trim()
    : '';

  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color: M.text }}>My Trainer</h2>

      {!trainer ? (
        <div style={{ background: M.card, border: `1px solid ${M.border}`, borderRadius: 14, padding: '40px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: M.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Dumbbell size={26} style={{ color: M.muted }} />
          </div>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: M.text2, letterSpacing: 1 }}>No Trainer Assigned</p>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: M.muted, marginTop: 6 }}>Contact the gym to get a trainer assigned to you.</p>
        </div>
      ) : (
        <div style={{ background: M.card, border: `1px solid ${M.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ background: M.accentbg2, borderBottom: `1px solid ${M.border}`, padding: '28px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 72, height: 72, borderRadius: 16, background: M.card2, border: `2px solid ${M.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: M.accent, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color: M.text, lineHeight: 1 }}>{name}</p>
              {trainer.specialization && (
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: M.accent, marginTop: 4 }}>
                  {trainer.specialization}
                </p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {trainer.profile?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: M.card2, border: `1px solid ${M.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={14} style={{ color: M.text2 }} />
                </div>
                <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: M.text }}>{trainer.profile.phone}</span>
              </div>
            )}
            {trainer.profile?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: M.card2, border: `1px solid ${M.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={14} style={{ color: M.text2 }} />
                </div>
                <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: M.text }}>{trainer.profile.email}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {trainer.bio && (
            <div style={{ padding: '0 24px 24px' }}>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: M.text2, marginBottom: 8 }}>About</p>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: M.text2, lineHeight: 1.7 }}>{trainer.bio}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}