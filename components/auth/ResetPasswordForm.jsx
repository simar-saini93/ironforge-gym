'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthShell, { AuthLogo } from '@/components/auth/AuthShell';
import PasswordRules, { validatePassword } from '@/components/auth/PasswordRules';

export default function ResetPasswordForm() {
  const router   = useRouter();
  const supabase = createClient();

  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login?error=invalid_link'); }
      else { setValidSession(true); }
    });
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
    if (updateError) { setError(updateError.message || 'Failed to reset password.'); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push('/login'), 2500);
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--if-bg)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--if-accent)' }} aria-label="Loading..." />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--if-bg)' }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(0,232,122,0.08)' }}>
            <CheckCircle2 size={32} style={{ color: 'var(--if-green)' }} aria-hidden="true" />
          </div>
          <h2 className="font-bebas mb-2" style={{ fontSize: 40, letterSpacing: 2, color: 'var(--if-text)' }}>PASSWORD RESET!</h2>
          <p className="font-barlow font-light" style={{ fontSize: 14, color: 'var(--if-mid)' }}>Your password has been reset. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const confirmBorder = confirm.length > 0 ? (passwordsMatch ? 'var(--if-green)' : 'var(--if-red)') : 'var(--if-border2)';

  return (
    <AuthShell>
      <div className="flex lg:hidden mb-10"><AuthLogo /></div>

      <div className="mb-8">
        <h2 className="font-bebas leading-none mb-2" style={{ fontSize: 'clamp(40px, 8vw, 52px)', letterSpacing: 2 }}>
          RESET <span style={{ color: 'var(--if-accent)' }}>PASSWORD</span>
        </h2>
        <p className="font-barlow font-light" style={{ fontSize: 13, color: 'var(--if-mid)' }}>
          Enter and confirm your new password below.
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
          <label htmlFor="reset-password" className="block font-condensed font-bold uppercase mb-2" style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--if-mid)' }}>New Password</label>
          <div className="relative">
            <input
              id="reset-password" type={showPass ? 'text' : 'password'}
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
          <label htmlFor="reset-confirm" className="block font-condensed font-bold uppercase mb-2" style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--if-mid)' }}>Confirm New Password</label>
          <input
            id="reset-confirm" type={showPass ? 'text' : 'password'}
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
            ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Resetting...</>
            : <><RotateCcw size={15} aria-hidden="true" /> Reset Password</>
          }
        </button>
      </form>

      <div className="mt-7 text-center">
        <a href="/login" className="font-condensed font-bold uppercase transition-opacity hover:opacity-100" style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--if-accent)', opacity: 0.8 }}>
          ← Back to Login
        </a>
      </div>
    </AuthShell>
  );
}
