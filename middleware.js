import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_ROUTES = ['/', '/contact', '/join', '/thank-you'];
const PUBLIC_API    = ['/api/plans', '/api/leads', '/api/schedule'];
const AUTH_ROUTES   = ['/login']; // set-password + reset-password handled separately

const ROLE_HOME = {
  admin:   '/admin/dashboard',
  trainer: '/trainer/dashboard',
  member:  '/member/dashboard',
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  function redirectTo(path) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url);
  }

  // ── 0. Static assets — skip everything
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next({ request });
  }

  // ── 1. Public API routes — skip all auth
  if (PUBLIC_API.some((r) => pathname.startsWith(r))) {
    return NextResponse.next({ request });
  }

  // ── 2. Public routes — skip all auth
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next({ request });
  }

  // ── 3. Supabase auth callback — skip all auth
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next({ request });
  }

  // ── 4. set-password + reset-password — allow logged in users through
  if (pathname.startsWith('/set-password') || pathname.startsWith('/reset-password')) {
    return NextResponse.next({ request });
  }

  // ── 5. All other routes need session
  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (!supabase) return NextResponse.next({ request });

  // ── 6. Not logged in
  if (!user) {
    if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) return supabaseResponse;
    return redirectTo('/login');
  }

  // ── 7. Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile) return supabaseResponse;

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return redirectTo('/login?error=account_inactive');
  }

  const { role } = profile;

  // ── 8. Redirect away from auth pages if already logged in
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return redirectTo(ROLE_HOME[role] || '/login');
  }

  // ── 9. Admin routes
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') return redirectTo(ROLE_HOME[role] || '/login');
    return supabaseResponse;
  }

  // ── 10. Trainer routes
  if (pathname.startsWith('/trainer')) {
    if (role !== 'trainer') return redirectTo(ROLE_HOME[role] || '/login');
    return supabaseResponse;
  }

  // ── 11. Member routes
  if (pathname.startsWith('/member')) {
    if (role !== 'member') return redirectTo(ROLE_HOME[role] || '/login');

    if (pathname !== '/member/inactive') {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (!member) return redirectTo('/member/inactive');

      const { data: sub } = await supabase
        .from('member_subscriptions')
        .select('id')
        .eq('member_id', member.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!sub) return redirectTo('/member/inactive');
    }

    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
