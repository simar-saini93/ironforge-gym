import { NextResponse }          from 'next/server';
import { createClient }          from '@supabase/supabase-js';
import { Resend }                from 'resend';
import { inviteMemberSchema }    from '@/lib/schemas/member';
import { memberInviteTemplate }  from '@/lib/email/templates';

// ── Service role client — bypasses RLS ───────────────────────
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  );
}

export async function POST(request) {
  try {
    const body = await request.json();

    // ── Validate input ────────────────────────────────────────
    const result = inviteMemberSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors.email?.[0] || 'Invalid input' },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const firstName  = body.firstName || 'there';
    const supabaseAdmin = getAdminClient();

    // ── Check if user already exists ─────────────────────────
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists.', existing: true },
        { status: 409 }
      );
    }

    // ── Create auth user (email pre-confirmed) ────────────────
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role: 'member' },
      });

    if (createError) {
      console.error('[invite-member] createUser error:', createError);
      return NextResponse.json(
        { error: createError.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    const userId = newUser.user.id;

    // ── Generate password setup link ──────────────────────────
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type:  'recovery',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/set-password`,
        },
      });

    if (linkError) {
      console.error('[invite-member] generateLink error:', linkError);
      return NextResponse.json(
        { userId, warning: 'User created but invite link could not be generated.' },
        { status: 201 }
      );
    }

    const { hashed_token } = linkData.properties;
    const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?token_hash=${hashed_token}&type=recovery&next=/set-password`;

    // ── Send invite email via Resend ──────────────────────────
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
      console.error('[invite-member] Resend error:', emailError);
      return NextResponse.json(
        { userId, warning: 'User created but invite email failed to send.' },
        { status: 201 }
      );
    }

    return NextResponse.json({ userId }, { status: 201 });

  } catch (err) {
    console.error('[invite-member] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
