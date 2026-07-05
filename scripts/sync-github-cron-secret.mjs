/**
 * Sync CRON_SECRET from .env.local to GitHub Actions secrets.
 * Requires: gh CLI authenticated (`gh auth login`) and repo access.
 *
 * Usage: node scripts/sync-github-cron-secret.mjs
 */

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");

function loadCronSecret() {
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found");
  }

  const match = fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("CRON_SECRET="));

  if (!match) {
    throw new Error("CRON_SECRET is missing in .env.local");
  }

  const value = match.slice("CRON_SECRET=".length).trim();
  if (!value || value === "change-this-cron-secret") {
    throw new Error("Set a real CRON_SECRET in .env.local and Vercel first");
  }

  return value;
}

try {
  execFileSync("gh", ["auth", "status"], { stdio: "pipe" });
} catch {
  console.error("Run `gh auth login` first, then retry this script.");
  process.exit(1);
}

const cronSecret = loadCronSecret();

execFileSync(
  "gh",
  ["secret", "set", "CRON_SECRET", "--repo", "lserlach/health-tracker", "--body", cronSecret],
  { stdio: "inherit" },
);

console.log("GitHub secret CRON_SECRET updated. Re-run the Reminder Cron workflow to verify.");
