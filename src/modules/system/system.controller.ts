import { Request, Response, NextFunction } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const systemController = {
  runSeed: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Running database seed...');
      const { stdout, stderr } = await execAsync('npm run db:seed');

      if (stderr && !stdout) {
        console.error('Seed stderr:', stderr);
      }

      console.log('Seed stdout:', stdout);

      res.status(200).json({
        message: 'Database seeded successfully',
        output: stdout,
      });
    } catch (error) {
      console.error('Seed error:', error);
      next(error);
    }
  },
};
