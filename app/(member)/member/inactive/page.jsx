'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function MemberInactivePage() {
  const router   = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(239,68,68,0.09)', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertTriangle size={28} style={{ color: '#ef4444' }} />
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, color: '#f0f0f0', marginBottom: 10 }}>
          Membership Inactive
        </h1>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 15, color: '#888', lineHeight: 1.7, marginBottom: 28 }}>
          Your membership is currently inactive or has expired. Please contact the gym to renew your membership and regain access.
        </p>
        <button
          onClick={handleLogout}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 24px', borderRadius: 10, background: 'transparent', border: '1px solid #2a2a2a', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#888', cursor: 'pointer', transition: 'all .15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888'; }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}