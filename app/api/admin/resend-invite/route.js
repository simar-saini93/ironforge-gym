import { NextResponse }         from 'next/server';
import { createClient }         from '@supabase/supabase-js';
import { Resend }               from 'resend';
import { memberInviteTemplate } from '@/lib/email/templates';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request) {
  try {
    const { email, firstName = 'there' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // Generate a fresh password reset link
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type:  'recovery',
        email: email.toLowerCase(),
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/set-password`,
        },
      });

    if (linkError) {
      console.error('[resend-invite] generateLink error:', linkError);
      return NextResponse.json(
        { error: 'Failed to generate invite link. Make sure the user exists.' },
        { status: 500 }
      );
    }

    const setupUrl = linkData.properties?.action_link;

    // Send via Resend
    const resend   = new Resend(process.env.RESEND_API_KEY);
    const template = memberInviteTemplate({
      firstName,
      gymName:  'IronForge Gym',
      setupUrl,
    });

    const { error: emailError } = await resend.emails.send({
      from:    process.env.EMAIL_FROM,
      to:      email,
      subject: template.subject,
      html:    template.html,
    });

    if (emailError) {
      console.error('[resend-invite] Resend error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error('[resend-invite] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
