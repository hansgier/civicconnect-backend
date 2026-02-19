import { boss } from '../../config/pg-boss.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../shared/utils/email.js';

export async function startEmailWorkers() {
  await boss.work('verification-email', async (job: { data: { to: string; token: string } } | { data: { to: string; token: string } }[]) => {
    // pg-boss might pass an array if configured, but default is single job object
    // The error "Cannot read properties of undefined (reading 'to')" suggests 
    // that the structure might be different than expected or it's an array.
    if (Array.isArray(job)) {
      for (const j of job) {
        await sendVerificationEmail(j.data.to, j.data.token);
      }
    } else {
      await sendVerificationEmail(job.data.to, job.data.token);
    }
  });

  await boss.work('password-reset-email', async (job: { data: { to: string; token: string } } | { data: { to: string; token: string } }[]) => {
    if (Array.isArray(job)) {
      for (const j of job) {
        await sendPasswordResetEmail(j.data.to, j.data.token);
      }
    } else {
      await sendPasswordResetEmail(job.data.to, job.data.token);
    }
  });
}

