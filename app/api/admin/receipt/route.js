import { NextResponse }  from 'next/server';
import PDFDocument       from 'pdfkit';
import { createClient }  from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies }       from 'next/headers';
import { Resend }        from 'resend';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch { return null; }
}

function receiptEmailTemplate({ member, payment, subscription, plan, branch, type }) {
  const isNew    = type === 'new';
  const date     = new Date(payment.payment_date || payment.created_at || new Date()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const startDate = new Date(subscription.start_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const endDate   = new Date(subscription.end_date   + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const amount    = Number(payment.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const method    = (payment.payment_method || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    subject: `${isNew ? 'Welcome to' : 'Membership Renewed —'} ${branch.name || 'IronForge Gym'} · Receipt #${payment.id?.slice(-8).toUpperCase()}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#080808;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

      <!-- Logo -->
      <tr><td align="center" style="padding-bottom:24px;">
        <span style="font-size:24px;font-weight:900;color:#f0f0f0;letter-spacing:3px;">
          IRON<span style="color:#E8FF00;">FORGE</span>
        </span>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#111111;border:1px solid #1f1f1f;border-radius:14px;padding:32px;">

        <!-- Accent + title -->
        <div style="width:48px;height:3px;background:#E8FF00;margin-bottom:20px;"></div>
        <h1 style="margin:0 0 6px;font-size:22px;font-weight:900;color:#f0f0f0;">
          ${isNew ? `Welcome, ${member.first_name}! 💪` : `Membership Renewed! ✅`}
        </h1>
        <p style="margin:0 0 24px;font-size:14px;color:#888888;">
          ${isNew
            ? `Your membership at ${branch.name || 'IronForge Gym'} is now active.`
            : `Your membership at ${branch.name || 'IronForge Gym'} has been successfully renewed.`
          }
        </p>

        <!-- Receipt box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:20px;margin-bottom:24px;">
          <tr><td style="padding-bottom:14px;border-bottom:1px solid #2a2a2a;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#555;letter-spacing:.15em;text-transform:uppercase;">Receipt</p>
            <p style="margin:0;font-size:13px;color:#888;">#${payment.id?.slice(-8).toUpperCase() || 'N/A'} · ${date}</p>
          </td></tr>

          ${[
            ['Member',         `${member.first_name} ${member.last_name}`],
            ['Member ID',      member.member_number || '—'],
            ['Plan',           `${(plan?.billing_cycle || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`],
            ['Valid From',     startDate],
            ['Valid Until',    endDate],
            ['Payment Method', method],
            ...(payment.reference_no ? [['Reference', payment.reference_no]] : []),
          ].map(([label, value]) => `
          <tr><td style="padding:10px 0;border-bottom:1px solid #1f1f1f;">
            <table width="100%"><tr>
              <td style="font-size:12px;color:#666;">${label}</td>
              <td align="right" style="font-size:12px;color:#f0f0f0;font-weight:600;">${value}</td>
            </tr></table>
          </td></tr>`).join('')}

          <!-- Amount -->
          <tr><td style="padding-top:16px;">
            <table width="100%"><tr>
              <td style="font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.1em;">Amount Paid</td>
              <td align="right" style="font-size:24px;font-weight:900;color:#E8FF00;">${amount}</td>
            </tr></table>
          </td></tr>
        </table>

        <p style="margin:0;font-size:12px;color:#444;line-height:1.7;">
          Keep this email as your payment receipt. 
          ${isNew ? 'You can now access the gym using your member app or QR code.' : 'Your access continues uninterrupted.'}
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding-top:20px;">
        <p style="margin:0;font-size:11px;color:#333;">
          © ${new Date().getFullYear()} ${branch.name || 'IronForge Gym'} · This is an automated receipt
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
  };
}

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payment_id, type = 'new' } = await request.json();
    if (!payment_id) return NextResponse.json({ error: 'payment_id required' }, { status: 400 });

    const db = getAdminClient();

    // Fetch payment with all related data
    const { data: payment, error: payErr } = await db
      .from('payments')
      .select(`
        id, amount, payment_method, payment_date, reference_no, created_at,
        member:members(
          id, member_number,
          profile:profiles(first_name, last_name, email)
        ),
        subscription:member_subscriptions(
          id, start_date, end_date,
          plan:membership_plans(billing_cycle, price)
        )
      `)
      .eq('id', payment_id)
      .single();

    if (payErr || !payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    const email = payment.member?.profile?.email;
    if (!email) return NextResponse.json({ error: 'No email on file' }, { status: 400 });

    const { data: branch } = await db.from('branches').select('name').limit(1).single();

    const member = {
      first_name:    payment.member?.profile?.first_name,
      last_name:     payment.member?.profile?.last_name,
      member_number: payment.member?.member_number,
    };

    const template = receiptEmailTemplate({
      member,
      payment,
      subscription: payment.subscription,
      plan:         payment.subscription?.plan,
      branch:       branch || {},
      type,
    });

    const receiptNo = payment.id?.slice(-8).toUpperCase();

    // Generate PDF receipt
    let attachments = [];
    try {
      const pdfBuffer = await generateReceiptPDF({
        member,
        payment,
        subscription: payment.subscription,
        plan:         payment.subscription?.plan,
        branch:       branch || {},
      });
      attachments = [{
        filename: `receipt-${receiptNo || 'ironforge'}.pdf`,
        content:  pdfBuffer,
      }];
    } catch (pdfErr) {
      console.error('[receipt] PDF generation failed:', pdfErr?.message);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailErr } = await resend.emails.send({
      from:        process.env.EMAIL_FROM,
      to:          email,
      subject:     template.subject,
      html:        template.html,
      attachments,
    });

    if (emailErr) {
      console.error('[receipt] Email error:', emailErr);
      return NextResponse.json({ error: 'Email failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[receipt] Error:', err?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
