import { NextResponse }         from 'next/server';
import { auth, clerkClient }    from '@clerk/nextjs/server';
import { Resend }               from 'resend';
import { drizzleDb }            from '@/db/index';
import { pendingInvitations, branches } from '@/db/schema';
import { eq }                   from 'drizzle-orm';
import { memberInviteTemplate } from '@/lib/email/templates';
import { inviteLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { inviteMemberSchema, validateBody } from '@/lib/utils/validate';

export async function POST(request) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit — 10 invites per hour per user ─────────────
    try { await inviteLimiter.check(10, userId); }
    catch { return rateLimitResponse(10); }

    // ── Validate input ────────────────────────────────────────
    const body = await request.json();
    const { success, data, error } = validateBody(inviteMemberSchema, body);
    if (!success) return error;

    const { email, firstName, branchId } = data;
    const client = await clerkClient();

    // ── Check if user already exists in Clerk ─────────────────
    const existing = await client.users.getUserList({ emailAddress: [email] });
    if (existing.totalCount > 0) {
      return NextResponse.json(
        { error: 'A user with this email already exists.', existing: true },
        { status: 409 }
      );
    }

    // ── Create Clerk invitation ───────────────────────────────
    const invitation = await client.invitations.createInvitation({
      emailAddress:   email,
      redirectUrl:    `${process.env.NEXT_PUBLIC_APP_URL}/set-password`,
      publicMetadata: { role: 'member', branchId },
      ignoreExisting: true,
    });

    // ── Send custom invite email via Resend ───────────────────
    const resend   = new Resend(process.env.RESEND_API_KEY);
    const template = memberInviteTemplate({
      firstName,
      gymName:  'IronForge Gym',
      setupUrl: invitation.url,
    });

    const { error: emailError } = await resend.emails.send({
      from:    process.env.EMAIL_FROM || 'IronForge Gym <noreply@ironforge.com>',
      to:      email,
      subject: template.subject,
      html:    template.html,
    });

    if (emailError) {
      // Revoke invite if email fails — keep state clean
      await client.invitations.revokeInvitation(invitation.id);
      console.error('[invite-member] Resend error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send invite email. Please try again.' },
        { status: 500 }
      );
    }

    // ── Store pending invitation via Drizzle ──────────────────
    const branchRows = await drizzleDb
      .select({ id: branches.id })
      .from(branches)
      .limit(1);
    const resolvedBranchId = branchId || branchRows[0]?.id;

    await drizzleDb
      .insert(pendingInvitations)
      .values({
        email:           email.trim().toLowerCase(),
        first_name:      firstName,
        clerk_invite_id: invitation.id,
        branch_id:       resolvedBranchId,
      })
      .onConflictDoUpdate({
        target: pendingInvitations.email,
        set:    { clerk_invite_id: invitation.id, first_name: firstName },
      });

    return NextResponse.json(
      { success: true, invitationId: invitation.id },
      { status: 201 }
    );

  } catch (err) {
    console.error('[invite-member] Unexpected error:', err?.message);
    console.error('[invite-member] Clerk errors:', JSON.stringify(err.errors));
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
