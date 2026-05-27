import { NextResponse }  from 'next/server';
import { auth }          from '@clerk/nextjs/server';
import { drizzleDb }     from '@/db/index';
import {
  payments, members, profiles, memberSubscriptions,
  membershipPlans, branches,
} from '@/db/schema';
import { eq }            from 'drizzle-orm';
import { Resend }        from 'resend';
import { adminLimiter, rateLimitResponse } from '@/lib/utils/rate-limit';
import { receiptSchema, validateBody }     from '@/lib/utils/validate';

// ── Receipt email template ────────────────────────────────────
function receiptEmailTemplate({ member, payment, subscription, plan, branch, type }) {
  const isNew     = type === 'new';
  const date      = new Date(payment.payment_date || payment.created_at || new Date()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
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
      <tr><td align="center" style="padding-bottom:24px;">
        <span style="font-size:24px;font-weight:900;color:#f0f0f0;letter-spacing:3px;">IRON<span style="color:#E8FF00;">FORGE</span></span>
      </td></tr>
      <tr><td style="background:#111111;border:1px solid #1f1f1f;border-radius:14px;padding:32px;">
        <div style="width:48px;height:3px;background:#E8FF00;margin-bottom:20px;"></div>
        <h1 style="margin:0 0 6px;font-size:22px;font-weight:900;color:#f0f0f0;">
          ${isNew ? `Welcome, ${member.first_name}! 💪` : `Membership Renewed! ✅`}
        </h1>
        <p style="margin:0 0 24px;font-size:14px;color:#888888;">
          ${isNew ? `Your membership at ${branch.name || 'IronForge Gym'} is now active.` : `Your membership has been successfully renewed.`}
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:20px;margin-bottom:24px;">
          <tr><td style="padding-bottom:14px;border-bottom:1px solid #2a2a2a;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#555;letter-spacing:.15em;text-transform:uppercase;">Receipt</p>
            <p style="margin:0;font-size:13px;color:#888;">#${payment.id?.slice(-8).toUpperCase() || 'N/A'} · ${date}</p>
          </td></tr>
          ${[
            ['Member',         `${member.first_name} ${member.last_name}`],
            ['Member ID',      member.member_number || '—'],
            ['Plan',           (plan?.billing_cycle || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())],
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
          <tr><td style="padding-top:16px;">
            <table width="100%"><tr>
              <td style="font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.1em;">Amount Paid</td>
              <td align="right" style="font-size:24px;font-weight:900;color:#E8FF00;">${amount}</td>
            </tr></table>
          </td></tr>
        </table>
        <p style="margin:0;font-size:12px;color:#444;line-height:1.7;">
          Keep this email as your payment receipt.
          ${isNew ? 'You can now access the gym using your member app.' : 'Your access continues uninterrupted.'}
        </p>
      </td></tr>
      <tr><td align="center" style="padding-top:20px;">
        <p style="margin:0;font-size:11px;color:#333;">© ${new Date().getFullYear()} ${branch.name || 'IronForge Gym'} · Automated receipt</p>
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
    // ── Auth ──────────────────────────────────────────────────
    const { userId, sessionClaims } = await auth();
    const role = sessionClaims?.metadata?.role;
    if (!userId || !['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Rate limit — 60 per minute per user ───────────────────
    try { await adminLimiter.check(60, userId); }
    catch { return rateLimitResponse(60); }

    // ── Validate input ────────────────────────────────────────
    const body = await request.json();
    const { success, data, error } = validateBody(receiptSchema, body);
    if (!success) return error;

    const { payment_id, type } = data;

    // ── Fetch payment + related data via Drizzle ──────────────
    const rows = await drizzleDb
      .select({
        payment_id:      payments.id,
        amount:          payments.amount,
        payment_method:  payments.payment_method,
        payment_date:    payments.payment_date,
        reference_no:    payments.reference_no,
        created_at:      payments.created_at,
        member_id:       members.id,
        member_number:   members.member_number,
        profile_id:      members.profile_id,
        first_name:      profiles.first_name,
        last_name:       profiles.last_name,
        email:           profiles.email,
        sub_id:          memberSubscriptions.id,
        start_date:      memberSubscriptions.start_date,
        end_date:        memberSubscriptions.end_date,
        billing_cycle:   membershipPlans.billing_cycle,
        plan_price:      membershipPlans.price,
      })
      .from(payments)
      .leftJoin(members,             eq(payments.member_id,              members.id))
      .leftJoin(profiles,            eq(members.profile_id,              profiles.id))
      .leftJoin(memberSubscriptions, eq(payments.subscription_id,        memberSubscriptions.id))
      .leftJoin(membershipPlans,     eq(memberSubscriptions.plan_id,     membershipPlans.id))
      .where(eq(payments.id, payment_id))
      .limit(1);

    const row = rows[0];
    if (!row) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    // ── Member can only get own receipt ───────────────────────
    if (role === 'member' && row.profile_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const email = row.email;
    if (!email) return NextResponse.json({ error: 'No email on file' }, { status: 400 });

    // ── Get branch name ───────────────────────────────────────
    const branchRows = await drizzleDb
      .select({ name: branches.name })
      .from(branches)
      .limit(1);
    const branch = branchRows[0] || {};

    // ── Build template data ───────────────────────────────────
    const member = {
      first_name:    row.first_name,
      last_name:     row.last_name,
      member_number: row.member_number,
    };
    const payment = {
      id:             row.payment_id,
      amount:         row.amount,
      payment_method: row.payment_method,
      payment_date:   row.payment_date,
      reference_no:   row.reference_no,
      created_at:     row.created_at,
    };
    const subscription = { start_date: row.start_date, end_date: row.end_date };
    const plan         = { billing_cycle: row.billing_cycle, price: row.plan_price };

    const template = receiptEmailTemplate({ member, payment, subscription, plan, branch, type });

    // ── Send email via Resend ─────────────────────────────────
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailErr } = await resend.emails.send({
      from:    process.env.EMAIL_FROM,
      to:      email,
      subject: template.subject,
      html:    template.html,
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
