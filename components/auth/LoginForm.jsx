'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthShell, { AuthLogo } from '@/components/auth/AuthShell';

const ERROR_MESSAGES = {
  invalid_credentials:  'Invalid email or password. Please try again.',
  account_inactive:     'Your account has been deactivated. Contact the gym.',
  no_profile:           'Account setup incomplete. Contact the gym.',
  auth_callback_failed: 'Authentication failed. Please try again.',
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
      <label
        htmlFor={id}
        className="block font-condensed font-bold uppercase mb-2"
        style={{ fontSize: 14, letterSpacing: '0.25em', color: 'var(--if-mid)' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full font-barlow outline-none transition-all"
          style={{
            height:       46,
            background:   'var(--if-card)',
            border:       `1px solid ${focused ? 'var(--if-accent)' : 'var(--if-border2)'}`,
            boxShadow:    focused ? '0 0 0 3px rgba(232,255,0,0.06)' : 'none',
            color:        'var(--if-text)',
            fontSize:     16,
            padding:      `0 ${rightSlot ? '44px' : '14px'} 0 14px`,
            borderRadius: 0,
            marginBottom: 12,
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
    <div
      className="flex items-start gap-3 p-3.5 mb-6"
      style={{ background: 'var(--if-redbg)', border: '1px solid var(--if-red)', color: 'var(--if-red)', margin: '8px 0px', padding: '4px' }}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle size={15} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span className="font-barlow font-light text-sm">{message}</span>
    </div>
  );
}

export default function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(ERROR_MESSAGES[urlError] || ERROR_MESSAGES.default);
  }, [searchParams]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password,
      });
      if (signInError) { setError(ERROR_MESSAGES.invalid_credentials); return; }

      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('role, is_active').eq('id', data.user.id).single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError(ERROR_MESSAGES.no_profile);
        return;
      }
      if (!profile.is_active) {
        await supabase.auth.signOut();
        setError(ERROR_MESSAGES.account_inactive);
        return;
      }
      router.push(ROLE_HOME[profile.role] || '/');
      router.refresh();
    } catch {
      setError(ERROR_MESSAGES.default);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    setLoading(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
    );
    setLoading(false);
    if (resetError) { setError(ERROR_MESSAGES.default); }
    else { alert(`Password reset link sent to ${email}`); }
  }

  return (
    <AuthShell>
      {/* Mobile logo */}
      <div className="flex lg:hidden mb-10">
        <AuthLogo />
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h2
          className="font-bebas leading-none mb-2"
          style={{ fontSize: 'clamp(40px, 8vw, 52px)', letterSpacing: 2 }}
        >
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
            <button
              type="button" onClick={() => setShowPass((s) => !s)}
              className="flex items-center justify-center transition-colors"
              style={{ color: 'var(--if-muted)', padding: '10px' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--if-mid)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--if-muted)')}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />

        {/* Forgot */}
        <div className="flex justify-end">
          <button
            type="button" onClick={handleForgotPassword}
            className="font-condensed font-bold uppercase transition-opacity hover:opacity-100"
            style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--if-accent)', opacity: 0.8 }}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 font-condensed font-bold uppercase transition-all"
          style={{
            height: 48, fontSize: 16, letterSpacing: '0.25em',
            background:   loading ? 'var(--if-border2)' : 'var(--if-accent)',
            color:        loading ? 'var(--if-muted)' : '#000',
            cursor:       loading ? 'not-allowed' : 'pointer',
            border:       'none', borderRadius: 0, marginBottom: '8px',
          }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'var(--if-text)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = loading ? 'var(--if-border2)' : 'var(--if-accent)'; e.currentTarget.style.transform = 'none'; }}
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Signing in...</>
            : <><LogIn size={16} aria-hidden="true" /> Sign In</>
          }
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6" aria-hidden="true">
        <div className="flex-1 h-px" style={{ background: 'var(--if-border)' }} />
        <span className="font-condensed uppercase" style={{ fontSize: 16, letterSpacing: '0.2em', color: 'var(--if-muted)' }}>
          Access by invitation only
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--if-border)' }} />
      </div>

      <p className="text-center font-barlow font-light leading-relaxed" style={{ fontSize: 16, color: 'var(--if-muted)' }}>
        Don&apos;t have an account?{' '}
        <a href="/contact" className="transition-opacity hover:opacity-100" style={{ color: 'var(--if-accent)', fontWeight: '500' }}>
          Contact the gym
        </a>{' '}
        to get started.
      </p>
    </AuthShell>
  );
}
