import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend }        from 'resend';
import { createClient as createServerClient } from '@/lib/supabase/server';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function codeEmailTemplate({ firstName, code, date }) {
  return {
    subject: `Your IronForge Access Code — ${code}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#080808;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <span style="font-size:22px;font-weight:900;color:#f0f0f0;letter-spacing:2px;">
            IRON<span style="color:#E8FF00;">FORGE</span>
          </span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#111111;border:1px solid #1f1f1f;border-radius:14px;padding:36px;">

          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#888;letter-spacing:.15em;text-transform:uppercase;">
            Good day, ${firstName}
          </p>
          <p style="margin:0 0 28px;font-size:16px;color:#f0f0f0;">
            Your access code for <strong>${date}</strong>
          </p>

          <!-- Code -->
          <div style="text-align:center;background:#1a1a1a;border:2px solid #E8FF00;border-radius:12px;padding:28px 0;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#888;letter-spacing:.2em;text-transform:uppercase;">Access Code</p>
            <p style="margin:0;font-size:56px;font-weight:900;color:#E8FF00;letter-spacing:16px;font-family:'Courier New',monospace;">
              ${code}
            </p>
          </div>

          <p style="margin:0 0 8px;font-size:13px;color:#888;text-align:center;">
            Show this code at the entrance or enter it on the keypad.
          </p>
          <p style="margin:0;font-size:12px;color:#444;text-align:center;">
            Valid for today only · Resets at midnight
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:20px;">
          <p style="margin:0;font-size:11px;color:#444;">
            IronForge Gym · Do not share this code
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

export async function POST() {
  try {
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    // Get member + profile
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('id, branch_id, profile:profiles(first_name, email)')
      .eq('profile_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check active subscription
    const { data: sub } = await supabaseAdmin
      .from('member_subscriptions')
      .select('id')
      .eq('member_id', member.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!sub) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if code already exists for today
    const { data: existing } = await supabaseAdmin
      .from('daily_access_codes')
      .select('code')
      .eq('branch_id', member.branch_id)
      .eq('valid_date', today)
      .maybeSingle();

    // Use existing code or generate new one
    let code;
    if (existing) {
      code = existing.code;
    } else {
      code = generateCode();
      await supabaseAdmin.from('daily_access_codes').insert({
        branch_id:  member.branch_id,
        code,
        valid_date: today,
      });
    }

    // Send email via Resend
    const resend   = new Resend(process.env.RESEND_API_KEY);
    const date     = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    const template = codeEmailTemplate({
      firstName: member.profile?.first_name || 'Member',
      code,
      date,
    });

    const { error: emailError } = await resend.emails.send({
      from:    process.env.EMAIL_FROM,
      to:      member.profile?.email,
      subject: template.subject,
      html:    template.html,
    });

    if (emailError) {
      console.error('[request-code] Email error:', emailError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error('[request-code] Error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
