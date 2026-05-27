import { NextResponse } from 'next/server';
import { drizzleDb }    from '@/db/index';
import { leads, branches } from '@/db/schema';
import { Resend }       from 'resend';
import { z }            from 'zod';

// ── Validation ───────────────────────────────────────────────
const leadSubmitSchema = z.object({
  first_name:         z.string().min(1, 'Name is required').max(50).trim(),
  last_name:          z.string().max(50).trim().optional().default(''),
  email:              z.string().email('Invalid email').toLowerCase().trim().optional().or(z.literal('')),
  phone:              z.string().min(7, 'Phone too short').max(20).trim(),
  message:            z.string().max(500).trim().optional(),
  source:             z.enum(['website','walk_in','referral','instagram','facebook','google','other']).default('website'),
  date_of_birth:      z.string().optional().or(z.literal('')),
  interested_plan_id: z.string().uuid().optional().or(z.literal('')),
  emergency_name:     z.string().max(100).optional(),
  emergency_phone:    z.string().max(20).optional(),
}).refine((d) => d.email || d.phone, {
  message: 'Either email or phone is required',
  path:    ['phone'],
});

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
        <tr><td align="center" style="padding-bottom:28px;">
          <span style="font-size:22px;font-weight:900;color:#f0f0f0;letter-spacing:2px;">
            IRON<span style="color:#E8FF00;">FORGE</span>
          </span>
        </td></tr>
        <tr><td style="background:#111111;border:1px solid #1f1f1f;border-radius:14px;padding:36px;">
          <div style="width:48px;height:3px;background:#E8FF00;margin-bottom:24px;"></div>
          <h1 style="margin:0 0 12px;font-size:28px;font-weight:900;color:#f0f0f0;">Thanks, ${firstName}! 💪</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#888888;line-height:1.7;">
            We've received your enquiry and our team will get back to you shortly.
            We're excited to help you start your fitness journey at <strong style="color:#f0f0f0;">${gymName}</strong>.
          </p>
          <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#888;letter-spacing:.15em;text-transform:uppercase;">What happens next?</p>
            ${['Our team will contact you within 24 hours','We\'ll discuss the best membership plan for you','Schedule a free gym tour at your convenience']
              .map((s, i) => `<p style="margin:6px 0;font-size:13px;color:#888;"><span style="display:inline-block;width:20px;height:20px;background:#E8FF00;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:900;color:#000;margin-right:10px;">${i+1}</span>${s}</p>`).join('')}
          </div>
          <p style="margin:0;font-size:13px;color:#444;line-height:1.6;">
            Have questions? Reply to this email or visit us at the gym.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:20px;">
          <p style="margin:0;font-size:11px;color:#444;">© ${new Date().getFullYear()} ${gymName}</p>
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
    const body   = await request.json();
    const result = leadSubmitSchema.safeParse(body);

    if (!result.success) {
      const firstError = Object.values(result.error.flatten().fieldErrors)[0]?.[0];
      return NextResponse.json({ error: firstError || 'Invalid input' }, { status: 400 });
    }

    const data = result.data;

    // Get branch
    const branchResult = await drizzleDb.select({ id: branches.id, name: branches.name }).from(branches).limit(1);
    const branch = branchResult[0];
    if (!branch) return NextResponse.json({ error: 'Gym not configured' }, { status: 500 });

    // Insert lead
    await drizzleDb.insert(leads).values({
      branch_id:          branch.id,
      first_name:         data.first_name,
      last_name:          data.last_name || '',
      email:              data.email     || null,
      phone:              data.phone,
      source:             data.source,
      status:             'new',
      notes:              data.message            || null,
      date_of_birth:      data.date_of_birth      || null,
      interested_plan_id: data.interested_plan_id || null,
      emergency_name:     data.emergency_name     || null,
      emergency_phone:    data.emergency_phone    || null,
    });

    // Send confirmation email if provided
    if (data.email) {
      const resend   = new Resend(process.env.RESEND_API_KEY);
      const template = leadConfirmationTemplate({ firstName: data.first_name, gymName: branch.name || 'IronForge Gym' });
      await resend.emails.send({
        from:    process.env.EMAIL_FROM,
        to:      data.email,
        subject: template.subject,
        html:    template.html,
      }).catch((e) => console.error('[leads/submit] Email error:', e));
    }

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err) {
    console.error('[leads/submit] Error:', err?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
