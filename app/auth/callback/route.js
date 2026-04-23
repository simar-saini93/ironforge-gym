import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ROLE_HOME = {
  admin:   '/admin/dashboard',
  trainer: '/trainer/dashboard',
  member:  '/member/dashboard',
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Always use APP_URL as origin to avoid localhost issues
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  const code       = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type       = searchParams.get('type');
  const next       = searchParams.get('next') || '/set-password';
  const error      = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
  }

  const supabase = await createClient();

  // ── Handle token_hash (recovery/invite links) ─────────────
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!verifyError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  // ── Handle PKCE code exchange ─────────────────────────────
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role) {
          return NextResponse.redirect(`${origin}${ROLE_HOME[profile.role]}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
