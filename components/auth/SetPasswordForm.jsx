'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthShell, { AuthLogo } from '@/components/auth/AuthShell';
import PasswordRules, { validatePassword } from '@/components/auth/PasswordRules';

const ROLE_HOME = {
  admin:   '/admin/dashboard',
  trainer: '/trainer/dashboard',
  member:  '/member/dashboard',
};

function SuccessScreen({ title, message }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--if-bg)' }}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(0,232,122,0.08)' }}>
          <CheckCircle2 size={32} style={{ color: 'var(--if-green)' }} aria-hidden="true" />
        </div>
        <h2 className="font-bebas mb-2" style={{ fontSize: 40, letterSpacing: 2, color: 'var(--if-text)' }}>{title}</h2>
        <p className="font-barlow font-light" style={{ fontSize: 14, color: 'var(--if-mid)' }}>{message}</p>
      </div>
    </div>
  );
}

export default function SetPasswordForm() {
  const router   = useRouter();
  const supabase = createClient();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function init() {
      setVerifying(true);

      // ── Try to get existing session first ──────────────────
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email ?? '');
        setVerifying(false);
        return;
      }

      // ── No session — try to exchange token from URL hash ───
      // Supabase invite links put token_hash in the URL fragment (#)
      // We need to read it client-side
      const hash   = window.location.hash;
      const params = new URLSearchParams(hash.replace('#', ''));

      const accessToken  = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const tokenHash    = params.get('token_hash');
      const type         = params.get('type');

      // Option 1: access_token + refresh_token in hash (Supabase implicit flow)
      if (accessToken && refreshToken) {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token:  accessToken,
          refresh_token: refreshToken,
        });

        if (!sessionError && data.user) {
          setUserEmail(data.user.email ?? '');
          setVerifying(false);
          return;
        }
      }

      // Option 2: token_hash in hash (OTP/invite flow)
      if (tokenHash && type) {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (!verifyError && data.user) {
          setUserEmail(data.user.email ?? '');
          setVerifying(false);
          return;
        }
      }

      // Option 3: check URL search params (from our callback route)
      const searchParams = new URLSearchParams(window.location.search);
      const codeParam    = searchParams.get('code');

      if (codeParam) {
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(codeParam);

        if (!exchangeError && data.user) {
          setUserEmail(data.user.email ?? '');
          setVerifying(false);
          return;
        }
      }

      // No valid session found
      router.replace('/login?error=invalid_link');
    }

    init();
  }, []);

  const allRulesPass   = validatePassword(password);
  const passwordsMatch = password === confirm && confirm.length > 0;
  const canSubmit      = allRulesPass && passwordsMatch && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!allRulesPass)   { setError('Please meet all password requirements.'); return; }
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || 'Failed to set password.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile }  = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push(ROLE_HOME[profile?.role] || '/login'), 2000);
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--if-bg)' }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: 'var(--if-accent)' }} />
          <p className="font-barlow font-light" style={{ fontSize: 14, color: 'var(--if-mid)' }}>
            Verifying your invite link...
          </p>
        </div>
      </div>
    );
  }

  if (success) return <SuccessScreen title="PASSWORD SET!" message="Redirecting to your dashboard..." />;

  const confirmBorder = confirm.length > 0
    ? (passwordsMatch ? 'var(--if-green)' : 'var(--if-red)')
    : 'var(--if-border2)';

  return (
    <AuthShell>
      <div className="flex lg:hidden mb-10"><AuthLogo /></div>

      <div className="mb-8">
        <h2 className="font-bebas leading-none mb-2" style={{ fontSize: 'clamp(40px, 8vw, 52px)', letterSpacing: 2 }}>
          SET <span style={{ color: 'var(--if-accent)' }}>PASSWORD</span>
        </h2>
        <p className="font-barlow font-light" style={{ fontSize: 13, color: 'var(--if-mid)' }}>
          {userEmail
            ? <>Welcome, <strong style={{ color: 'var(--if-text)', fontWeight: 600 }}>{userEmail}</strong>. Create a secure password to continue.</>
            : 'Create a secure password to access your account.'
          }
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3.5 mb-6" style={{ background: 'var(--if-redbg)', border: '1px solid var(--if-red)', color: 'var(--if-red)' }} role="alert" aria-live="polite">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span className="font-barlow font-light text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* New password */}
        <div>
          <label htmlFor="new-password" className="block font-condensed font-bold uppercase mb-2" style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--if-mid)' }}>
            New Password
          </label>
          <div className="relative">
            <input
              id="new-password" type={showPass ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="new-password"
              className="w-full font-barlow outline-none transition-all"
              style={{ height: 46, background: 'var(--if-card)', border: '1px solid var(--if-border2)', color: 'var(--if-text)', fontSize: 14, padding: '0 44px 0 14px', borderRadius: 0 }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--if-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,255,0,0.06)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'var(--if-border2)'; e.target.style.boxShadow = 'none'; }}
            />
            <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center" style={{ color: 'var(--if-muted)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-mid)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')} aria-label={showPass ? 'Hide' : 'Show'}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <PasswordRules password={password} />
        </div>

        {/* Confirm */}
        <div>
          <label htmlFor="confirm-password" className="block font-condensed font-bold uppercase mb-2" style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--if-mid)' }}>
            Confirm Password
          </label>
          <input
            id="confirm-password" type={showPass ? 'text' : 'password'}
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••" required autoComplete="new-password"
            className="w-full font-barlow outline-none"
            style={{ height: 46, background: 'var(--if-card)', border: `1px solid ${confirmBorder}`, color: 'var(--if-text)', fontSize: 14, padding: '0 14px', borderRadius: 0, transition: 'border-color 0.2s' }}
          />
          {confirm.length > 0 && !passwordsMatch && (
            <p className="mt-1.5 font-barlow font-light" style={{ fontSize: 12, color: 'var(--if-red)' }}>Passwords do not match</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit" disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 font-condensed font-bold uppercase transition-all"
          style={{ height: 48, fontSize: 13, letterSpacing: '0.2em', background: canSubmit ? 'var(--if-accent)' : 'var(--if-border2)', color: canSubmit ? '#000' : 'var(--if-muted)', cursor: canSubmit ? 'pointer' : 'not-allowed', border: 'none', borderRadius: 0, marginTop: 8 }}
          onMouseEnter={(e) => { if (canSubmit) { e.currentTarget.style.background = 'var(--if-text)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = canSubmit ? 'var(--if-accent)' : 'var(--if-border2)'; e.currentTarget.style.transform = 'none'; }}
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Setting password...</>
            : <><KeyRound size={15} aria-hidden="true" /> Set Password & Continue</>
          }
        </button>
      </form>
    </AuthShell>
  );
}
