import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "node:path";

const migrationsFolder = path.join(__dirname, "migrations");

async function runMigrations(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder });
    console.log("Migrations applied successfully");
  } finally {
    await client.end();
  }
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
