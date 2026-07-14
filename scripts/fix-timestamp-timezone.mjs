/**
 * Fix timestamps that were stored as UTC wall-clock instead of reminder timezone.
 * Usage: node scripts/fix-timestamp-timezone.mjs [--dry-run]
 */

import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");
const dryRun = process.argv.includes("--dry-run");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const REMINDER_TIMEZONE = process.env.REMINDER_TIMEZONE ?? "Europe/Moscow";
const REMINDER_TZ_OFFSET = process.env.REMINDER_TZ_OFFSET ?? "+03:00";

function getReminderDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: REMINDER_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatReminderTime(iso) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: REMINDER_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function buildReminderDateTime(dateKey, time) {
  const [hours, minutes] = time.split(":").map(Number);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return new Date(`${dateKey}T${hh}:${mm}:00.000${REMINDER_TZ_OFFSET}`);
}

function reinterpretUtcWallClockAsReminderTime(iso) {
  const date = new Date(iso);
  const dateKey = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
  const time = `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
  return buildReminderDateTime(dateKey, time).toISOString();
}

function buildWrongUtcWallClock(dateKey, time) {
  const [hours, minutes] = time.split(":").map(Number);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return new Date(`${dateKey}T${hh}:${mm}:00.000Z`).toISOString();
}

function fixGenericTimestamp(iso) {
  if (!iso) return iso;
  const fixed = reinterpretUtcWallClockAsReminderTime(iso);
  return fixed === iso ? iso : fixed;
}

function fixMedicationScheduledFor(iso, scheduleTimes) {
  if (!iso || !scheduleTimes?.length) return fixGenericTimestamp(iso);

  const dateKey = getReminderDateKey(new Date(iso));
  const displayTime = formatReminderTime(iso);
  const currentMs = new Date(iso).getTime();

  const matchedByDisplay = scheduleTimes.find((time) => time === displayTime);
  if (matchedByDisplay) {
    return buildReminderDateTime(dateKey, matchedByDisplay).toISOString();
  }

  for (const time of scheduleTimes) {
    const correct = buildReminderDateTime(dateKey, time).toISOString();
    if (new Date(correct).getTime() === currentMs) {
      return correct;
    }

    const wrong = buildWrongUtcWallClock(dateKey, time);
    if (new Date(wrong).getTime() === currentMs) {
      return correct;
    }
  }

  return fixGenericTimestamp(iso);
}

async function updateTimestamp(client, table, id, column, nextValue) {
  if (dryRun) return;
  await client.query(`update ${table} set ${column} = $1 where id = $2`, [nextValue, id]);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

let changed = 0;

function timestampsEqual(left, right) {
  if (!left || !right) return left === right;
  return new Date(left).getTime() === new Date(right).getTime();
}

async function fixTableTimestamps(table, column, rows) {
  for (const row of rows) {
    const nextValue = fixGenericTimestamp(row[column]);
    if (timestampsEqual(nextValue, row[column])) continue;
    changed += 1;
    console.log(
      `${table}.${column} ${row.id}: ${row[column]} -> ${nextValue} (${formatReminderTime(nextValue)})`,
    );
    await updateTimestamp(client, table, row.id, column, nextValue);
  }
}

const glucose = await client.query("select id, measured_at from glucose_logs order by measured_at");
await fixTableTimestamps("glucose_logs", "measured_at", glucose.rows);

const weight = await client.query("select id, measured_at from weight_logs order by measured_at");
await fixTableTimestamps("weight_logs", "measured_at", weight.rows);

const bp = await client.query(
  "select id, measured_at from blood_pressure_logs order by measured_at",
);
await fixTableTimestamps("blood_pressure_logs", "measured_at", bp.rows);

const meals = await client.query("select id, eaten_at, remind_at from meal_logs order by eaten_at");
for (const row of meals.rows) {
  for (const column of ["eaten_at", "remind_at"]) {
    const nextValue = fixGenericTimestamp(row[column]);
    if (timestampsEqual(nextValue, row[column])) continue;
    changed += 1;
    console.log(
      `meal_logs.${column} ${row.id}: ${row[column]} -> ${nextValue} (${formatReminderTime(nextValue)})`,
    );
    await updateTimestamp(client, "meal_logs", row.id, column, nextValue);
  }
}

const medLogs = await client.query(`
  select ml.id, ml.scheduled_for, ml.taken_at, m.schedule_times
  from medication_logs ml
  join medications m on m.id = ml.medication_id
  order by ml.scheduled_for
`);

for (const row of medLogs.rows) {
  const scheduleTimes = Array.isArray(row.schedule_times) ? row.schedule_times : [];
  const nextScheduled = fixMedicationScheduledFor(row.scheduled_for, scheduleTimes);
  if (nextScheduled !== row.scheduled_for && !timestampsEqual(nextScheduled, row.scheduled_for)) {
    changed += 1;
    console.log(
      `medication_logs.scheduled_for ${row.id}: ${row.scheduled_for} -> ${nextScheduled} (${formatReminderTime(nextScheduled)})`,
    );
    await updateTimestamp(client, "medication_logs", row.id, "scheduled_for", nextScheduled);
  }

  if (row.taken_at) {
    const nextTaken = fixGenericTimestamp(row.taken_at);
    if (nextTaken !== row.taken_at && !timestampsEqual(nextTaken, row.taken_at)) {
      changed += 1;
      console.log(
        `medication_logs.taken_at ${row.id}: ${row.taken_at} -> ${nextTaken} (${formatReminderTime(nextTaken)})`,
      );
      await updateTimestamp(client, "medication_logs", row.id, "taken_at", nextTaken);
    }
  }
}

await client.end();

console.log(
  dryRun
    ? `Dry run complete. ${changed} timestamp(s) would be updated.`
    : `Done. Updated ${changed} timestamp(s).`,
);
