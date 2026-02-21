import { sendEmail } from './src/shared/utils/email.js';
import { env } from './src/config/env.js';

async function main() {
  console.log('Sending test email...');
  await sendEmail({
    to: 'test@example.com',
    subject: 'Test Email from Ormoc PIS',
    html: '<h1>If you see this, Resend is working!</h1>',
  });
  console.log('Email sent (check logs for errors)');
}

main().catch(console.error);
