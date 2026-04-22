import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ROLE_HOME = {
  admin:   '/admin/dashboard',
  trainer: '/trainer/dashboard',
  member:  '/member/dashboard',
};

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);

  const code  = searchParams.get('code');
  const next  = searchParams.get('next') || '/set-password';
  const error = searchParams.get('error');

  // Handle explicit errors
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`
    );
  }

  // Handle PKCE code exchange (OAuth / magic link with PKCE)
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // Existing user with role — go to their portal
        if (profile?.role) {
          return NextResponse.redirect(`${origin}${ROLE_HOME[profile.role]}`);
        }

        // New user — set password
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // No code — Supabase invite links use URL hash (#access_token=...)
  // Hash is not readable server-side, so redirect to set-password
  // and let the client-side SetPasswordForm handle the token
  return NextResponse.redirect(`${origin}${next}`);
}
