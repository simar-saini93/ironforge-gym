import { NextResponse }   from 'next/server';
import { Webhook }        from 'svix';
import { clerkClient }    from '@clerk/nextjs/server';
import { drizzleDb }      from '@/db/index';
import { profiles, pendingInvitations, members } from '@/db/schema';
import { eq }             from 'drizzle-orm';

// Webhook from Clerk — fires when user is created
// Sets role in Clerk metadata + creates/updates profile in Drizzle

export async function POST(request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 });
  }

  // ── Verify webhook signature ──────────────────────────────
  const svix_id        = request.headers.get('svix-id');
  const svix_timestamp = request.headers.get('svix-timestamp');
  const svix_signature = request.headers.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await request.text();
  const wh   = new Webhook(WEBHOOK_SECRET);

  let event;
  try {
    event = wh.verify(body, {
      'svix-id':        svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('[clerk-webhook] signature verification failed:', err?.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── Handle user.created ───────────────────────────────────
  if (event.type === 'user.created') {
    const { id: clerkUserId, email_addresses, public_metadata } = event.data;
    const email    = email_addresses?.[0]?.email_address?.toLowerCase();
    const role     = public_metadata?.role || 'member';
    const branchId = public_metadata?.branchId;

    if (!email) {
      console.error('[clerk-webhook] No email found in user.created event');
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    try {
      const client = await clerkClient();

      // ── Get pending invitation data ───────────────────────
      const pendingRows = await drizzleDb
        .select()
        .from(pendingInvitations)
        .where(eq(pendingInvitations.email, email))
        .limit(1);
      const pending = pendingRows[0] || null;

      const firstName        = pending?.first_name || email.split('@')[0];
      const resolvedBranchId = branchId || pending?.branch_id;

      // ── Set role in Clerk public metadata ─────────────────
      await client.users.updateUser(clerkUserId, {
        publicMetadata: { role, branchId: resolvedBranchId },
      });

      // ── Upsert profile in Drizzle ──────────────────────────
      // If placeholder profile exists (created at invite time), update it
      // Otherwise insert fresh profile
      await drizzleDb
        .insert(profiles)
        .values({
          id:         clerkUserId,
          branch_id:  resolvedBranchId,
          role,
          first_name: firstName,
          last_name:  '',
          email,
          is_active:  true,
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set:    { role, branch_id: resolvedBranchId, is_active: true },
        });

      // ── Update member record if placeholder exists ─────────
      // Placeholder member was created with clerk_invite_id as profile_id
      // Now update to use real Clerk user ID
      if (pending?.clerk_invite_id && pending.clerk_invite_id !== clerkUserId) {
        await drizzleDb
          .update(members)
          .set({ profile_id: clerkUserId })
          .where(eq(members.profile_id, pending.clerk_invite_id))
          .catch((err) => console.error('[clerk-webhook] member profile_id update error:', err?.message));

        // Update the placeholder profile id too (if it exists separately)
        await drizzleDb
          .update(profiles)
          .set({ id: clerkUserId })
          .where(eq(profiles.id, pending.clerk_invite_id))
          .catch(() => {}); // ignore if already updated above
      }

      // ── Clean up pending invitation ────────────────────────
      if (pending) {
        await drizzleDb
          .delete(pendingInvitations)
          .where(eq(pendingInvitations.email, email));
      }

      console.log(`[clerk-webhook] user.created: ${email} role=${role} branchId=${resolvedBranchId}`);
    } catch (err) {
      console.error('[clerk-webhook] processing error:', err?.message);
      // Return 200 to prevent Clerk from retrying — log for manual fix
      // User already exists in Clerk, profile issues can be fixed manually
    }
  }

  return NextResponse.json({ received: true });
}
