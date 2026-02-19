import { boss } from '../../config/pg-boss.js';

export const EMAIL_JOBS = {
  VERIFICATION: 'verification-email',
  PASSWORD_RESET: 'password-reset-email',
} as const;

export async function addEmailJob(type: string, data: { to: string; token: string }) {
  await boss.send(type, data, {
    retryLimit: 3,
    retryDelay: 2,         // 2 seconds base delay
    retryBackoff: true,    // exponential backoff (2s, 4s, 8s)
  });
}
