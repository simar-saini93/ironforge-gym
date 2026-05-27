import { NextResponse }   from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { z }              from 'zod';

const schema = z.object({
  password: z.string().min(8),
});

// Uses Clerk Backend API to set password — bypasses client-side reverification
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body   = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid password' }, { status: 400 });

    const client = await clerkClient();

    // Backend API can set password without reverification
    await client.users.updateUser(userId, {
      password:            parsed.data.password,
      skipPasswordChecks:  false,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/member/set-password]', err?.message);
    return NextResponse.json({ error: err?.message || 'Failed to set password' }, { status: 500 });
  }
}
