import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool }    from 'pg';
import * as schema from './schema.js';

// ── Singleton pool — prevents multiple connections in dev ─────
// Next.js hot reload creates new module instances
// globalThis persists across hot reloads

const globalForDb = globalThis;

if (!globalForDb._pgPool) {
  globalForDb._pgPool = new Pool({
    connectionString:      process.env.DATABASE_URL,
    max:                   10,
    idleTimeoutMillis:     30000,
    connectionTimeoutMillis: 2000,
  });

  globalForDb._pgPool.on('error', (err) => {
    console.error('[db] Pool error:', err.message);
  });
}

export const pool      = globalForDb._pgPool;
export const drizzleDb = drizzle(pool, { schema });
