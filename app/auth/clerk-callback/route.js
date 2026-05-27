import { NextResponse }      from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const ROLE_HOME = {
  admin:   '/admin/dashboard',
  trainer: '/trainer/dashboard',
  member:  '/member/dashboard',
};

export async function GET(request) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(`${base}/login?error=session_expired`);
    }

    const client = await clerkClient();
    const user   = await client.users.getUser(userId);
    const role   = user.publicMetadata?.role;


    if (!role) {
      return NextResponse.redirect(`${base}/login?error=no_profile`);
    }

    const destination = ROLE_HOME[role] || '/login';
    return NextResponse.redirect(`${base}${destination}`);

  } catch (err) {
    console.error('[clerk-callback] error:', err);
    return NextResponse.redirect(`${base}/login?error=auth_callback_failed`);
  }
}
