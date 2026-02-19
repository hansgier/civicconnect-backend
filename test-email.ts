import { sendEmail } from './src/shared/utils/email.js';
import { env } from './src/config/env.js';

async function main() {
  console.log('Sending test email to:', env.SMTP_USER);
  await sendEmail({
    to: env.SMTP_USER,
    subject: 'Test Email from Ormoc PIS',
    html: '<h1>If you see this, SMTP is working!</h1>'
  });
  console.log('Email sent (check logs for errors)');
}

main().catch(console.error);
