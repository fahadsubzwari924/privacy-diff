import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../../env';
import * as schema from './schema';

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { db: DrizzleClient | undefined };

function createDbClient(): DrizzleClient {
  const client = postgres(env.databaseUrl, { max: 5 });
  return drizzle(client, { schema });
}

export const db: DrizzleClient = globalForDb.db ?? createDbClient();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
