import { PgBoss } from 'pg-boss';
import { env } from './env.js';

export const boss = new PgBoss({
  connectionString: env.DATABASE_URL,
  schema: 'pgboss',
});
