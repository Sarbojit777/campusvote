const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOTPEmail(to, otp) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'CampusVote <noreply@campusvote.in>',
    to,
    subject: 'Your CampusVote OTP Code',
    html: `
      <div style="font-family: Inter, sans-serif; background: #0a0a0a; color: #f5f5f5; padding: 40px; border-radius: 12px; max-width: 480px; margin: auto;">
        <h2 style="color: #ffffff; margin-bottom: 8px;">CampusVote</h2>
        <p style="color: #a1a1aa; margin-bottom: 32px;">Secure · Transparent · Student-Led</p>
        <div style="background: #111111; border: 1px solid #2a2a2a; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 16px;">Your one-time verification code</p>
          <div style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #ffffff; margin: 16px 0;">${otp}</div>
          <p style="color: #52525b; font-size: 12px;">Valid for 10 minutes. Do not share this code.</p>
        </div>
        <p style="color: #52525b; font-size: 12px; margin-top: 24px; text-align: center;">
          If you did not request this, please ignore this email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendOTPEmail };
