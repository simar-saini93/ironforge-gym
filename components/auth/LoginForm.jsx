'use client';

import { useState, useEffect }  from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignIn, useClerk, useAuth } from '@clerk/nextjs';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import AuthShell, { AuthLogo } from '@/components/auth/AuthShell';

const ERROR_MESSAGES = {
  invalid_credentials:  'Invalid email or password. Please try again.',
  account_inactive:     'Your account has been deactivated. Contact the gym.',
  no_profile:           'Account setup incomplete. Contact the gym.',
  auth_callback_failed: 'Authentication failed. Please try again.',
  session_expired:      'Your session has expired. Please sign in again.',
  default:              'Something went wrong. Please try again.',
};

const ROLE_HOME = {
  admin:   '/admin/dashboard',
  trainer: '/trainer/dashboard',
  member:  '/member/dashboard',
};

function AuthInput({ id, label, type = 'text', value, onChange, placeholder, autoComplete, required = true, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block font-condensed font-bold uppercase mb-2"
        style={{ fontSize: 14, letterSpacing: '0.25em', color: 'var(--if-mid)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete} required={required}
          className="w-full font-barlow outline-none transition-all"
          style={{
            height: 46, background: 'var(--if-card)',
            border: `1px solid ${focused ? 'var(--if-accent)' : 'var(--if-border2)'}`,
            boxShadow: focused ? '0 0 0 3px rgba(232,255,0,0.06)' : 'none',
            color: 'var(--if-text)', fontSize: 16,
            padding: `0 ${rightSlot ? '44px' : '14px'} 0 14px`,
            borderRadius: 0, marginBottom: 12,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightSlot && (
          <div className="absolute right-0 top-0 h-full flex items-center pr-3.5">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 p-3.5 mb-6"
      style={{ background: 'var(--if-redbg)', border: '1px solid var(--if-red)', color: 'var(--if-red)', margin: '8px 0px', padding: '4px' }}
      role="alert" aria-live="polite">
      <AlertCircle size={15} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span className="font-barlow font-light text-sm">{message}</span>
    </div>
  );
}

export default function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { signIn, fetchStatus } = useSignIn();
  const { setActive }          = useClerk();
  const { isSignedIn }         = useAuth();
  const isLoaded = fetchStatus !== 'loading';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (isSignedIn) router.push('/auth/clerk-callback');
  }, [isSignedIn]);

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(ERROR_MESSAGES[urlError] || ERROR_MESSAGES.default);
  }, [searchParams]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!isLoaded) return;
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn.password({
        emailAddress: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const code = error.errors?.[0]?.code;
        if (code === 'session_exists') {
          // Already signed in — just redirect
          router.push('/auth/clerk-callback');
          return;
        }
        if (code === 'form_password_incorrect' || code === 'form_identifier_not_found') {
          setError(ERROR_MESSAGES.invalid_credentials);
        } else if (code === 'user_locked') {
          setError(ERROR_MESSAGES.account_inactive);
        } else {
          setError(error.errors?.[0]?.message || ERROR_MESSAGES.default);
        }
        return;
      }

      // Success — set active session and redirect
      if (signIn.createdSessionId) {
        await setActive({ session: signIn.createdSessionId });
      }
      router.push('/auth/clerk-callback');
    } catch (err) {
      console.error('[login] Unexpected error:', err);
      setError(ERROR_MESSAGES.default);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!isLoaded) return;
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    setLoading(true);
    setError('');

    try {
      await signIn.create({
        strategy:   'reset_password_email_code',
        identifier: email.trim().toLowerCase(),
      });
      router.push(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      // Don't reveal if email exists — always redirect for security
      console.error('[forgot-password] error:', err);
      router.push(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="flex lg:hidden mb-10"><AuthLogo /></div>

      <div className="mb-8">
        <h2 className="font-bebas leading-none mb-2"
          style={{ fontSize: 'clamp(40px, 8vw, 52px)', letterSpacing: 2 }}>
          SIGN <span style={{ color: 'var(--if-accent)' }}>IN</span>
        </h2>
        <p className="font-barlow font-light" style={{ fontSize: 16, color: 'var(--if-mid)' }}>
          Enter your credentials to access your portal
        </p>
      </div>

      <ErrorAlert message={error} />

      <form onSubmit={handleLogin} noValidate className="space-y-5">
        <AuthInput
          id="email" label="Email Address" type="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@ironforge.com" autoComplete="email"
        />
        <AuthInput
          id="password" label="Password"
          type={showPass ? 'text' : 'password'}
          value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" autoComplete="current-password"
          rightSlot={
            <button type="button" onClick={() => setShowPass((s) => !s)}
              className="flex items-center justify-center transition-colors"
              style={{ color: 'var(--if-muted)', padding: '10px' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-mid)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
              aria-label={showPass ? 'Hide password' : 'Show password'}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />

        <div className="flex justify-end">
          <button type="button" onClick={handleForgotPassword}
            className="font-condensed font-bold uppercase transition-opacity hover:opacity-100"
            style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--if-accent)', opacity: 0.8 }}>
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading || !isLoaded}
          className="w-full flex items-center justify-center gap-2 font-condensed font-bold uppercase transition-all"
          style={{
            height: 48, fontSize: 16, letterSpacing: '0.25em',
            background: loading ? 'var(--if-border2)' : 'var(--if-accent)',
            color: loading ? 'var(--if-muted)' : '#000',
            cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none', borderRadius: 0, marginBottom: '8px',
          }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'var(--if-text)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = loading ? 'var(--if-border2)' : 'var(--if-accent)'; e.currentTarget.style.transform = 'none'; }}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
            : <><LogIn size={16} /> Sign In</>
          }
        </button>
      </form>

      <div className="flex items-center gap-3 my-6" aria-hidden="true">
        <div className="flex-1 h-px" style={{ background: 'var(--if-border)' }} />
        <span className="font-condensed uppercase" style={{ fontSize: 16, letterSpacing: '0.2em', color: 'var(--if-muted)' }}>
          Access by invitation only
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--if-border)' }} />
      </div>

      <p className="text-center font-barlow font-light leading-relaxed" style={{ fontSize: 16, color: 'var(--if-muted)' }}>
        Don&apos;t have an account?{' '}
        <a href="/contact" className="transition-opacity hover:opacity-100"
          style={{ color: 'var(--if-accent)', fontWeight: '500' }}>
          Contact the gym
        </a>{' '}
        to get started.
      </p>
    </AuthShell>
  );
}
