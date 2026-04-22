// ── IronForge Email Templates ────────────────────────────────

const BASE_STYLES = `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  margin: 0; padding: 0; background: #0a0a0a; color: #f0f0f0;
`;

const ACCENT = '#F5C518';
const BG     = '#0a0a0a';
const CARD   = '#1a1a1a';
const BORDER = '#2a2a2a';
const TEXT   = '#f0f0f0';
const MUTED  = '#888888';

// ── Member Invite Email ──────────────────────────────────────
export function memberInviteTemplate({ firstName, gymName = 'IronForge Gym', setupUrl }) {
  return {
    subject: `Welcome to ${gymName} — Set up your account`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to ${gymName}</title>
</head>
<body style="${BASE_STYLES}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG}; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${ACCENT}; border-radius:8px; width:36px; height:36px; text-align:center; vertical-align:middle;">
                    <span style="font-size:18px; font-weight:900; color:#000; line-height:36px;">⚡</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:20px; font-weight:900; color:${TEXT}; letter-spacing:1px;">
                      IRON<span style="color:${ACCENT};">FORGE</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${CARD}; border:1px solid ${BORDER}; border-radius:12px; padding:40px 36px;">

              <!-- Heading -->
              <h1 style="font-size:26px; font-weight:800; color:${TEXT}; margin:0 0 8px; letter-spacing:-0.5px;">
                Welcome, ${firstName}! 💪
              </h1>
              <p style="font-size:15px; color:${MUTED}; margin:0 0 28px; line-height:1.6;">
                Your membership at <strong style="color:${TEXT};">${gymName}</strong> has been created.
                Set up your password to access your member portal.
              </p>

              <!-- Divider -->
              <div style="height:1px; background:${BORDER}; margin-bottom:28px;"></div>

              <!-- What you get -->
              <p style="font-size:11px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:${MUTED}; margin:0 0 14px;">
                Your Member Portal Includes
              </p>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                ${[
                  '🏋️  View your membership & subscription status',
                  '📅  Check your attendance history',
                  '🔑  Get your daily access code for entry',
                  '💳  View payment history',
                ].map((item) => `
                  <tr>
                    <td style="padding:6px 0; font-size:14px; color:${MUTED}; line-height:1.5;">
                      ${item}
                    </td>
                  </tr>
                `).join('')}
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a
                      href="${setupUrl}"
                      style="display:inline-block; background:${ACCENT}; color:#000; font-size:14px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; text-decoration:none; padding:14px 36px; border-radius:8px;"
                    >
                      Set Up My Account →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <p style="font-size:12px; color:${MUTED}; text-align:center; margin:16px 0 0; line-height:1.5;">
                This link expires in <strong style="color:${TEXT};">24 hours</strong>.
                If it expires, contact your gym admin for a new link.
              </p>

              <!-- Divider -->
              <div style="height:1px; background:${BORDER}; margin:28px 0;"></div>

              <!-- Raw link -->
              <p style="font-size:12px; color:${MUTED}; margin:0; line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:
                <br/>
                <a href="${setupUrl}" style="color:${ACCENT}; word-break:break-all; font-size:11px;">
                  ${setupUrl}
                </a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="font-size:12px; color:${MUTED}; margin:0; line-height:1.6;">
                This email was sent by ${gymName}.<br/>
                If you weren't expecting this, please ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };
}
