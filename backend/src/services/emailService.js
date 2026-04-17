/**
 * Email Service — WorkSafe
 * Sends transactional emails via Gmail SMTP + App Password
 * Uses nodemailer with a persistent connection pool
 */

const nodemailer = require('nodemailer');

// ── Transport (created lazily on first use) ──────────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,   // Google App Password (16 chars, no spaces)
    },
  });

  return _transporter;
}

const FROM = `"${process.env.EMAIL_FROM_NAME || 'WorkSafe'}" <${process.env.EMAIL_USER}>`;
const BASE = process.env.APP_BASE_URL || 'http://localhost:3000';

// ── Templates ────────────────────────────────────────────────

function verificationEmailHTML(name, verifyUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#4F46E5;padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:inline-block;line-height:36px;text-align:center;">
                🛡️
              </div>
              <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">WorkSafe</span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0F172A;">
              Verify your email, ${name || 'Rider'} 👋
            </h1>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
              Welcome to WorkSafe — India's first parametric income protection for gig workers.
              Click the button below to verify your email address and complete your registration.
            </p>

            <div style="text-align:center;margin:32px 0;">
              <a href="${verifyUrl}"
                style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;
                       font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;
                       box-shadow:0 4px 12px rgba(79,70,229,0.3);">
                ✅ Verify My Email
              </a>
            </div>

            <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;text-align:center;">
              This link expires in <strong>24 hours</strong>.
            </p>
            <p style="margin:0;color:#94A3B8;font-size:12px;text-align:center;word-break:break-all;">
              Or copy this link: <a href="${verifyUrl}" style="color:#4F46E5;">${verifyUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #E2E8F0;text-align:center;">
            <p style="margin:0;color:#94A3B8;font-size:12px;">
              If you didn't create a WorkSafe account, you can safely ignore this email.
              <br />© 2026 WorkSafe · DEVTrails · Built with Guidewire
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Send email verification link
 * @param {string} toEmail
 * @param {string} name
 * @param {string} token  - UUID verification token
 */
async function sendVerificationEmail(toEmail, name, token) {
  const verifyUrl = `${BASE}/verify-email?token=${token}`;

  await getTransporter().sendMail({
    from:    FROM,
    to:      toEmail,
    subject: '✅ Verify your WorkSafe account',
    html:    verificationEmailHTML(name, verifyUrl),
    text:    `Hi ${name},\n\nVerify your WorkSafe account by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  });

  console.log(`[Email] Verification email sent to ${toEmail}`);
}

/**
 * Verify transporter connection (called at startup to catch mis-config early)
 */
async function verifyEmailConfig() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD ||
      process.env.EMAIL_USER === 'your_gmail@gmail.com') {
    console.warn('[Email] ⚠️  Email not configured — skipping SMTP verification. Set EMAIL_USER and EMAIL_APP_PASSWORD in .env');
    return false;
  }
  try {
    await getTransporter().verify();
    console.log(`✅ Email service ready (${process.env.EMAIL_USER})`);
    return true;
  } catch (err) {
    console.warn('[Email] ⚠️  SMTP connection failed:', err.message);
    return false;
  }
}

module.exports = { sendVerificationEmail, verifyEmailConfig };
