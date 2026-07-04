/**
 * Apply pending SQL migrations from supabase/migrations/
 * Usage: DATABASE_URL="postgresql://..." node scripts/apply-migrations.mjs [from_migration]
 */

import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "../supabase/migrations");
const connectionString = process.env.DATABASE_URL;
const fromMigration = process.argv[2] ?? "006";

if (!connectionString) {
  console.error("Missing DATABASE_URL environment variable.");
  process.exit(1);
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .filter((file) => file >= `${fromMigration}_`);

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log(`Connected. Applying ${files.length} migration(s)...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`→ ${file}`);
    await client.query(sql);
  }

  console.log("All migrations applied successfully.");
} catch (error) {
  console.error("Migration failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
