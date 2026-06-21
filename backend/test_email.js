import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const smtpEmail = process.env.SMTP_EMAIL;
const smtpPassword = process.env.SMTP_PASSWORD;

console.log(`Email: ${smtpEmail}`);
console.log(`Password: ${smtpPassword ? '****' + smtpPassword.slice(-4) : '(NOT SET)'}`);

if (!smtpEmail || !smtpPassword) {
  console.error('SMTP_EMAIL or SMTP_PASSWORD not set in .env');
  process.exit(1);
}

// Try service: "gmail" first (original config that was working)
const transport = nodemailer.createTransport({
  service: "gmail",
  auth: { user: smtpEmail, pass: smtpPassword },
});

console.log('\nVerifying transport...');
try {
  await transport.verify();
  console.log('✓ Transport verified successfully');
} catch (err) {
  console.error('✗ Transport verification failed:', err.message);
  process.exit(1);
}

const testEmail = smtpEmail; // Send to self
console.log(`\nSending test email to ${testEmail}...`);
try {
  const info = await transport.sendMail({
    from: `"EcoFeast Test" <${smtpEmail}>`,
    to: testEmail,
    subject: `EcoFeast SMTP Test - ${new Date().toLocaleTimeString()}`,
    html: `<h2>SMTP Test Email</h2><p>If you see this, email sending works!</p><p>Time: ${new Date().toISOString()}</p>`,
  });
  console.log('✓ Email sent! MessageId:', info.messageId);
  console.log('  Response:', info.response);
} catch (err) {
  console.error('✗ Send failed:', err.message);
  console.error('  Full error:', err);
}

process.exit(0);
