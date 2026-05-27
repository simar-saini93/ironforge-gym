import { NextResponse }         from 'next/server';
import { auth, clerkClient }    from '@clerk/nextjs/server';
import { Resend }               from 'resend';
import { drizzleDb }            from '@/db/index';
import { trainers, profiles }   from '@/db/schema';
import { eq }                   from 'drizzle-orm';
import { memberInviteTemplate } from '@/lib/email/templates';
import { inviteLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { resendInviteSchema, validateBody } from '@/lib/utils/validate';

export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try { await inviteLimiter.check(10, userId); }
    catch { return rateLimitResponse(10); }

    const body = await request.json();

    // ── Trainer resend invite ─────────────────────────────────
    if (body.trainerId) {
      const client = await clerkClient();

      const rows = await drizzleDb
        .select({ email: profiles.email, first_name: profiles.first_name, branch_id: profiles.branch_id })
        .from(trainers)
        .leftJoin(profiles, eq(trainers.profile_id, profiles.id))
        .where(eq(trainers.id, body.trainerId))
        .limit(1);

      const trainer = rows[0];
      if (!trainer?.email) return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });

      // Revoke existing pending invitation
      const invitations = await client.invitations.getInvitationList({ status: 'pending' });
      const existing    = invitations.data?.find((i) => i.emailAddress === trainer.email);
      if (existing) await client.invitations.revokeInvitation(existing.id);

      const invitation = await client.invitations.createInvitation({
        emailAddress:   trainer.email,
        redirectUrl:    `${process.env.NEXT_PUBLIC_APP_URL}/set-password`,
        publicMetadata: { role: 'trainer', branchId: trainer.branch_id },
        ignoreExisting: true,
      });

      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error: emailError } = await resend.emails.send({
        from:    process.env.EMAIL_FROM,
        to:      trainer.email,
        subject: `Your IronForge Trainer Account — Set Up Access`,
        html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#080808;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
  <tr><td align="center"><table style="max-width:480px;width:100%;">
    <tr><td align="center" style="padding-bottom:24px;">
      <span style="font-size:24px;font-weight:900;color:#f0f0f0;letter-spacing:3px;">IRON<span style="color:#22c55e;">FORGE</span></span>
    </td></tr>
    <tr><td style="background:#111;border:1px solid #1f1f1f;border-radius:14px;padding:32px;">
      <div style="width:48px;height:3px;background:#22c55e;margin-bottom:20px;"></div>
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#f0f0f0;">Trainer Account Access</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#888;">Hi ${trainer.first_name || 'Trainer'}, click below to set up your trainer account.</p>
      <a href="${invitation.url}" style="display:inline-block;padding:12px 28px;background:#22c55e;color:#000;font-weight:700;font-size:13px;text-decoration:none;border-radius:8px;">SET UP ACCOUNT →</a>
      <p style="margin:24px 0 0;font-size:12px;color:#444;">Link expires in 24 hours.</p>
    </td></tr>
  </table></td></tr>
</table></body></html>`,
      });

      if (emailError) {
        await client.invitations.revokeInvitation(invitation.id).catch(() => {});
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // ── Member resend invite (existing flow) ──────────────────
    const { success, data, error } = validateBody(resendInviteSchema, body);
    if (!success) return error;

    const { email, firstName } = data;
    const client = await clerkClient();

    const invitations = await client.invitations.getInvitationList({ status: 'pending' });
    const existing    = invitations.data?.find((i) => i.emailAddress === email);
    if (existing) await client.invitations.revokeInvitation(existing.id);

    const invitation = await client.invitations.createInvitation({
      emailAddress:   email,
      redirectUrl:    `${process.env.NEXT_PUBLIC_APP_URL}/set-password`,
      publicMetadata: { role: 'member' },
    });

    const resend   = new Resend(process.env.RESEND_API_KEY);
    const template = memberInviteTemplate({
      firstName: firstName || 'there',
      gymName:   'IronForge Gym',
      setupUrl:  invitation.url,
    });

    const { error: emailError } = await resend.emails.send({
      from:    process.env.EMAIL_FROM || 'IronForge Gym <noreply@ironforge.com>',
      to:      email,
      subject: template.subject,
      html:    template.html,
    });

    if (emailError) {
      await client.invitations.revokeInvitation(invitation.id);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[resend-invite]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
