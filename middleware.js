import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/contact(.*)',
  '/join(.*)',
  '/thank-you(.*)',
  '/login(.*)',
  '/sign-in(.*)',
  '/set-password(.*)',
  '/reset-password(.*)',
  '/auth/(.*)',
  '/api/plans(.*)',
  '/api/leads(.*)',
  '/api/schedule(.*)',
  '/api/webhooks(.*)',
]);

const ROLE_HOME = {
  admin:   '/admin/dashboard',
  trainer: '/trainer/dashboard',
  member:  '/member/dashboard',
};

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  function redirectTo(path) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url);
  }

  if (isPublicRoute(request)) return NextResponse.next();

  const { userId, sessionClaims } = await auth.protect();
  if (!userId) return redirectTo('/login');

  const role = sessionClaims?.metadata?.role;

  // ── DEBUG — remove after fixing

  if (!role) return redirectTo('/login?error=no_profile');

  if (pathname.startsWith('/login') || pathname.startsWith('/sign-in')) {
    return redirectTo(ROLE_HOME[role] || '/');
  }

  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') return redirectTo(ROLE_HOME[role] || '/login');
    return NextResponse.next();
  }

  if (pathname.startsWith('/trainer')) {
    if (role !== 'trainer') return redirectTo(ROLE_HOME[role] || '/login');
    return NextResponse.next();
  }

  if (pathname.startsWith('/member')) {
    if (role !== 'member') return redirectTo(ROLE_HOME[role] || '/login');
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
