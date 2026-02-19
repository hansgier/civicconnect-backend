import { config } from 'dotenv';
import path from 'path';

// Load test-specific environment variables before anything else
config({ path: path.resolve(process.cwd(), '.env.test') });

process.env.NODE_ENV = 'test';
