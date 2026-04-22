import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend }        from 'resend';
import { z }            from 'zod';

// ── Validation ───────────────────────────────────────────────
const leadSubmitSchema = z.object({
  first_name: z.string().min(1, 'Name is required').max(50).trim(),
  last_name:  z.string().max(50).trim().optional().default(''),
  email:      z.string().email('Invalid email').toLowerCase().trim().optional().or(z.literal('')),
  phone:      z.string().min(7, 'Phone too short').max(20).trim(),
  message:    z.string().max(500).trim().optional(),
  source:        z.enum(['website', 'walk_in', 'referral', 'instagram', 'facebook', 'google', 'other']).default('website'),
  date_of_birth:      z.string().optional().or(z.literal('')),
  interested_plan_id: z.string().uuid().optional().or(z.literal('')),
  emergency_name:     z.string().max(100).optional(),
  emergency_phone:    z.string().max(20).optional(),
}).refine((d) => d.email || d.phone, {
  message: 'Either email or phone is required',
  path:    ['phone'],
});

// ── Admin Supabase client ────────────────────────────────────
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Confirmation email template ──────────────────────────────
function leadConfirmationTemplate({ firstName, gymName = 'IronForge Gym' }) {
  return {
    subject: `Thanks for your interest in ${gymName}!`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#080808;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <span style="font-size:22px;font-weight:900;color:#f0f0f0;letter-spacing:2px;">
            IRON<span style="color:#E8FF00;">FORGE</span>
          </span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#111111;border:1px solid #1f1f1f;border-radius:14px;padding:36px;">

          <!-- Accent line -->
          <div style="width:48px;height:3px;background:#E8FF00;margin-bottom:24px;"></div>

          <h1 style="margin:0 0 12px;font-size:28px;font-weight:900;color:#f0f0f0;letter-spacing:-0.5px;">
            Thanks, ${firstName}! 💪
          </h1>

          <p style="margin:0 0 20px;font-size:15px;color:#888888;line-height:1.7;">
            We've received your enquiry and our team will get back to you shortly.
            We're excited to help you start your fitness journey at <strong style="color:#f0f0f0;">${gymName}</strong>.
          </p>

          <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#888;letter-spacing:.15em;text-transform:uppercase;">What happens next?</p>
            <table cellpadding="0" cellspacing="0" width="100%">
              ${[
                'Our team will contact you within 24 hours',
                'We\'ll discuss the best membership plan for you',
                'Schedule a free gym tour at your convenience',
              ].map((s, i) => `
              <tr>
                <td style="padding:6px 0;vertical-align:top;">
                  <span style="display:inline-block;width:20px;height:20px;background:#E8FF00;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:900;color:#000;margin-right:10px;flex-shrink:0;">${i + 1}</span>
                  <span style="font-size:13px;color:#888888;">${s}</span>
                </td>
              </tr>`).join('')}
            </table>
          </div>

          <p style="margin:0;font-size:13px;color:#444444;line-height:1.6;">
            Have questions? Reply to this email or visit us at the gym.<br/>
            We look forward to meeting you!
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:20px;">
          <p style="margin:0;font-size:11px;color:#444444;">
            © ${new Date().getFullYear()} ${gymName} · You received this because you submitted an enquiry
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

// ── Route handler ────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate
    const result = leadSubmitSchema.safeParse(body);
    if (!result.success) {
      const firstError = Object.values(result.error.flatten().fieldErrors)[0]?.[0];
      return NextResponse.json({ error: firstError || 'Invalid input' }, { status: 400 });
    }

    const data          = result.data;
    const supabaseAdmin = getAdminClient();

    // Get branch — use first active branch
    const { data: branch } = await supabaseAdmin
      .from('branches')
      .select('id, name')
      .limit(1)
      .single();

    if (!branch) {
      return NextResponse.json({ error: 'Gym not configured' }, { status: 500 });
    }

    // Insert lead
    const { error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        branch_id:  branch.id,
        first_name: data.first_name,
        last_name:  data.last_name || null,
        email:      data.email     || null,
        phone:      data.phone,
        source:     data.source,
        status:     'new',
        notes:         data.message       || null,
        date_of_birth:      data.date_of_birth      || null,
        interested_plan_id: data.interested_plan_id || null,
        emergency_name:     data.emergency_name     || null,
        emergency_phone:    data.emergency_phone    || null,
      });

    if (insertError) {
      console.error('[leads/submit] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save enquiry' }, { status: 500 });
    }

    // Send confirmation email if email provided
    if (data.email) {
      const resend   = new Resend(process.env.RESEND_API_KEY);
      const template = leadConfirmationTemplate({
        firstName: data.first_name,
        gymName:   branch.name || 'IronForge Gym',
      });

      const { error: emailError } = await resend.emails.send({
        from:    process.env.EMAIL_FROM,
        to:      data.email,
        subject: template.subject,
        html:    template.html,
      });

      if (emailError) {
        // Don't fail the request if email fails — lead is already saved
        console.error('[leads/submit] Email error:', emailError);
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err) {
    console.error('[leads/submit] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
