/**
 * One-time script to apply supabase/full_schema.sql
 * Usage: DATABASE_URL="postgresql://..." node scripts/apply-schema.mjs
 */

import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, "../supabase/full_schema.sql");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL environment variable.");
  process.exit(1);
}

const sql = fs.readFileSync(schemaPath, "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected. Applying schema...");
  await client.query(sql);
  console.log("Success! Tables created.");
} catch (error) {
  console.error("Migration failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
