'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignUp, useUser, useClerk } from '@clerk/nextjs';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import AuthShell, { AuthLogo }  from '@/components/auth/AuthShell';
import PasswordRules, { validatePassword } from '@/components/auth/PasswordRules';

const ROLE_HOME = {
  admin:   '/admin/dashboard',
  trainer: '/trainer/dashboard',
  member:  '/member/dashboard',
};

function SuccessScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--if-bg)' }}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(0,232,122,0.08)' }}>
          <CheckCircle2 size={32} style={{ color: 'var(--if-green)' }} />
        </div>
        <h2 className="font-bebas mb-2" style={{ fontSize: 40, letterSpacing: 2, color: 'var(--if-text)' }}>
          PASSWORD SET!
        </h2>
        <p className="font-barlow font-light" style={{ fontSize: 14, color: 'var(--if-mid)' }}>
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
}

export default function SetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { setActive } = useClerk();

  // ── v7 API: no isLoaded, uses signUp directly ─────────────
  const { signUp }        = useSignUp();
  const { isSignedIn, user } = useUser();

  const token       = searchParams.get('__clerk_ticket');
  const clerkStatus = searchParams.get('__clerk_status');

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [ready,     setReady]     = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // ── If already signed in — show password form (don't redirect)
  // Member clicked invite link → Clerk auto-signed them in
  // But they still need to set their password
  useEffect(() => {
    if (!isSignedIn) return;
    const email = user?.primaryEmailAddress?.emailAddress || '';
    setUserEmail(email);
    setReady(true); // show the password form
  }, [isSignedIn]);

  // ── Initialize signUp with ticket ─────────────────────────
  useEffect(() => {
    if (!token)  { router.replace('/login?error=invalid_link'); return; }
    if (isSignedIn) return; // handled above
    if (!signUp) return;

    async function init() {
      try {
        const result = await signUp.create({
          strategy: 'ticket',
          ticket:   token,
        });
        setUserEmail(result.emailAddress || '');
        setReady(true);
      } catch (err) {
        const code = err?.errors?.[0]?.code;
        console.error('[set-password] init error:', code, err?.errors?.[0]?.message);

        if (code === 'resource_already_exists') {
          router.replace('/login');
        } else if (code === 'client_state_invalid') {
          // signUp already in progress — just show form
          setUserEmail(signUp?.emailAddress || '');
          setReady(true);
        } else {
          setError(err?.errors?.[0]?.message || 'Invalid or expired invite link.');
          setReady(true);
        }
      }
    }

    init();
  }, [signUp, token, isSignedIn]);

  const allRulesPass   = validatePassword(password);
  const passwordsMatch = password === confirm && confirm.length > 0;
  const canSubmit      = allRulesPass && passwordsMatch && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!allRulesPass)   { setError('Please meet all password requirements.'); return; }
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      // ── Case 1: already signed in via Clerk auto-session ────
      // Use server-side API to set password (bypasses client reverification)
      if (isSignedIn && user) {
        const setPwdRes = await fetch('/api/member/set-password', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ password }),
        });
        if (!setPwdRes.ok) {
          const e = await setPwdRes.json();
          setError(e.error || 'Failed to set password. Please try again.');
          setLoading(false);
          return;
        }
        const res  = await fetch('/api/auth/role');
        const data = await res.json();
        setSuccess(true);
        setTimeout(() => router.push(ROLE_HOME[data?.role] || '/member/dashboard'), 1800);
        return;
      }

      // ── Case 2: normal signUp flow ────────────────────────
      await signUp.update({ password });

      console.log('[set-password] signUp after update:', {
        status:           signUp.status,
        missingFields:    signUp.missingFields,
        unverifiedFields: signUp.unverifiedFields,
        createdSessionId: signUp.createdSessionId,
      });

      if (signUp.status === 'complete') {
        if (signUp.createdSessionId) {
          await setActive({ session: signUp.createdSessionId });
        }
        const res  = await fetch('/api/auth/role');
        const data = await res.json();
        setSuccess(true);
        setTimeout(() => router.push(ROLE_HOME[data?.role] || '/member/dashboard'), 1800);
        return;
      }

      setError('Account setup incomplete. Please contact the gym.');
    } catch (err) {
      console.error('[set-password] submit error:', err);
      const code = err?.errors?.[0]?.code;
      if (code === 'form_password_pwned') {
        setError('This password was found in a data breach. Please choose a different one.');
      } else {
        setError(err?.errors?.[0]?.message || 'Failed to set password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── No token ──────────────────────────────────────────────
  if (!token) return null;

  // ── Loading ───────────────────────────────────────────────
  if (!ready && !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--if-bg)' }}>
        <div id="clerk-captcha" style={{ position: 'absolute', opacity: 0 }} />
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: 'var(--if-accent)' }} />
          <p className="font-barlow font-light" style={{ fontSize: 14, color: 'var(--if-mid)' }}>
            Verifying your invite link...
          </p>
        </div>
      </div>
    );
  }

  if (success) return <SuccessScreen />;

  const confirmBorder = confirm.length > 0
    ? (passwordsMatch ? 'var(--if-green)' : 'var(--if-red)')
    : 'var(--if-border2)';

  return (
    <AuthShell>
      {/* Required by Clerk for bot protection in custom flows */}
      <div id="clerk-captcha" />
      <div className="flex lg:hidden mb-10"><AuthLogo /></div>

      <div className="mb-8">
        <h2 className="font-bebas leading-none mb-2"
          style={{ fontSize: 'clamp(40px, 8vw, 52px)', letterSpacing: 2 }}>
          SET <span style={{ color: 'var(--if-accent)' }}>PASSWORD</span>
        </h2>
        <p className="font-barlow font-light" style={{ fontSize: 13, color: 'var(--if-mid)' }}>
          {userEmail
            ? <>Welcome, <strong style={{ color: 'var(--if-text)', fontWeight: 600 }}>{userEmail}</strong>. Create a secure password.</>
            : 'Create a secure password to access your account.'
          }
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3.5 mb-6"
          style={{ background: 'var(--if-redbg)', border: '1px solid var(--if-red)', color: 'var(--if-red)', borderRadius: 8 }}
          role="alert" aria-live="polite">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span className="font-barlow font-light text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="new-password" className="block font-condensed font-bold uppercase mb-2"
            style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--if-mid)' }}>
            New Password
          </label>
          <div className="relative">
            <input id="new-password" type={showPass ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="new-password"
              className="w-full font-barlow outline-none transition-all"
              style={{ height: 46, background: 'var(--if-card)', border: '1px solid var(--if-border2)', color: 'var(--if-text)', fontSize: 14, padding: '0 44px 0 14px', borderRadius: 0 }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--if-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,255,0,0.06)'; }}
              onBlur={(e)  => { e.target.style.borderColor = 'var(--if-border2)'; e.target.style.boxShadow = 'none'; }}
            />
            <button type="button" onClick={() => setShowPass((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center"
              style={{ color: 'var(--if-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-mid)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
              aria-label={showPass ? 'Hide password' : 'Show password'}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <PasswordRules password={password} />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block font-condensed font-bold uppercase mb-2"
            style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--if-mid)' }}>
            Confirm Password
          </label>
          <input id="confirm-password" type={showPass ? 'text' : 'password'}
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••" required autoComplete="new-password"
            className="w-full font-barlow outline-none"
            style={{ height: 46, background: 'var(--if-card)', border: `1px solid ${confirmBorder}`, color: 'var(--if-text)', fontSize: 14, padding: '0 14px', borderRadius: 0, transition: 'border-color 0.2s' }}
          />
          {confirm.length > 0 && !passwordsMatch && (
            <p className="mt-1.5 font-barlow font-light" style={{ fontSize: 12, color: 'var(--if-red)' }}>
              Passwords do not match
            </p>
          )}
        </div>

        <button type="submit" disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 font-condensed font-bold uppercase transition-all"
          style={{ height: 48, fontSize: 13, letterSpacing: '0.2em', background: canSubmit ? 'var(--if-accent)' : 'var(--if-border2)', color: canSubmit ? '#000' : 'var(--if-muted)', cursor: canSubmit ? 'pointer' : 'not-allowed', border: 'none', borderRadius: 0, marginTop: 8 }}
          onMouseEnter={(e) => { if (canSubmit) { e.currentTarget.style.background = 'var(--if-text)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = canSubmit ? 'var(--if-accent)' : 'var(--if-border2)'; e.currentTarget.style.transform = 'none'; }}
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Setting password...</>
            : <><KeyRound size={15} /> Set Password & Continue</>
          }
        </button>
      </form>
    </AuthShell>
  );
}
