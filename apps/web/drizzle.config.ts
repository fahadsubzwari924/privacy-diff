import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

// drizzle-kit CLI doesn't load .env.local automatically (that's Next.js behaviour)
dotenv.config({ path: '.env.local' });

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
