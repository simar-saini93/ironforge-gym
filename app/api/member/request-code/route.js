import { NextResponse } from 'next/server';
import { auth }         from '@clerk/nextjs/server';
import { drizzleDb }    from '@/db/index';
import { members, memberAccessCodes, profiles, branches } from '@/db/schema';
import { eq }           from 'drizzle-orm';
import { Resend }       from 'resend';
import { memberLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';

export async function POST() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.metadata?.role !== 'member') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit — 10 per minute per member ─────────────────
    try { await memberLimiter.check(10, userId); }
    catch { return rateLimitResponse(10); }

    // ── Get member ────────────────────────────────────────────
    const memberRows = await drizzleDb
      .select({ id: members.id })
      .from(members)
      .where(eq(members.profile_id, userId))
      .limit(1);
    const member = memberRows[0];
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    // ── Generate 6-digit code ─────────────────────────────────
    const code      = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // ── Upsert code (one per member) ──────────────────────────
    await drizzleDb
      .insert(memberAccessCodes)
      .values({ member_id: member.id, code, expires_at: expiresAt })
      .onConflictDoUpdate({
        target: memberAccessCodes.member_id,
        set:    { code, expires_at: expiresAt },
      });

    // ── Send code via email ───────────────────────────────────
    const profileRows = await drizzleDb
      .select({ first_name: profiles.first_name, email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    const profile = profileRows[0];

    if (profile?.email) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    process.env.EMAIL_FROM,
        to:      profile.email,
        subject: 'Your IronForge Access Code',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#080808;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <span style="font-size:22px;font-weight:900;color:#f0f0f0;letter-spacing:2px;">
            IRON<span style="color:#E8FF00;">FORGE</span>
          </span>
        </td></tr>
        <tr><td style="background:#111111;border:1px solid #1f1f1f;border-radius:14px;padding:36px;">
          <div style="width:48px;height:3px;background:#E8FF00;margin-bottom:20px;"></div>
          <p style="margin:0 0 8px;font-size:14px;color:#888;font-family:'Helvetica Neue',Arial,sans-serif;">
            Hi ${profile.first_name || 'Member'},
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#888;line-height:1.6;">
            Your daily gym access code is:
          </p>
          <div style="background:#1a1a1a;border:2px solid #E8FF00;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0;font-size:48px;font-weight:900;color:#E8FF00;letter-spacing:12px;font-family:'Courier New',monospace;">
              ${code}
            </p>
          </div>
          <p style="margin:0;font-size:13px;color:#444;line-height:1.6;text-align:center;">
            Valid for 10 minutes · Do not share this code
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:20px;">
          <p style="margin:0;font-size:11px;color:#444;">© ${new Date().getFullYear()} IronForge Gym</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }).catch((e) => console.error('[request-code] Email error:', e?.message));
    }

    return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error('[request-code]', err?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
