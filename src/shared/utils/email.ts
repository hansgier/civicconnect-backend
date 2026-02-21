import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

const resend = new Resend(env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      throw error;
    }

    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error({ err: error }, 'Failed to send email');
    throw error; // Re-throw so pg-boss retries work
  }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const link = `${env.CLIENT_URL}/verify-email?token=${token}`;
  const html = `
    <h1>Verify Your Email</h1>
    <p>Click the link below to verify your email address:</p>
    <a href="${link}">${link}</a>
  `;
  await sendEmail({ to: email, subject: 'Verify Your Email', html });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const link = `${env.CLIENT_URL}/reset-password?token=${token}`;
  const html = `
    <h1>Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${link}">${link}</a>
  `;
  await sendEmail({ to: email, subject: 'Reset Your Password', html });
};
