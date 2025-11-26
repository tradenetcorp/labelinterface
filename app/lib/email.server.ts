import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn(
    "SMTP configuration incomplete. Email sending will not work. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables."
  );
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

/**
 * Send OTP code to user's email
 * Falls back to console logging if SMTP is not configured or fails
 */
export async function sendOTPEmail(email: string, code: string): Promise<void> {
  // If SMTP is not configured, log to console
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[DEV] OTP for ${email}: ${code}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: "Your Login Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Login Code</h2>
          <p>Your one-time login code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background-color: #f0f0f0; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 5 minutes.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
      text: `Your login code is: ${code}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    });
    console.log(`[SMTP] OTP email sent successfully to ${email}`);
  } catch (error) {
    // If email sending fails (e.g., invalid credentials), fall back to console logging
    console.error("Failed to send email via SMTP:", error);
    console.log(`[DEV] OTP for ${email} (SMTP failed, using console): ${code}`);
    // Don't throw error - allow login to proceed with console logging
  }
}

