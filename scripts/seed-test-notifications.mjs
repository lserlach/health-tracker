/**
 * Enable demo notifications for the local test account.
 * Usage: node scripts/seed-test-notifications.mjs
 */

import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");

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

const TEST_EMAIL = "lserlach+test@gmail.com";
const TZ_OFFSET = process.env.REMINDER_TZ_OFFSET ?? "+03:00";

function resolveTestEmail() {
  const raw = process.env.AUTH_USERS?.trim();
  if (!raw) return TEST_EMAIL;
  try {
    const users = JSON.parse(raw);
    const testUser = users.find((user) => user.login === "test");
    return testUser?.email ?? TEST_EMAIL;
  } catch {
    return TEST_EMAIL;
  }
}

function at(dateKey, time) {
  return `${dateKey}T${time}:00${TZ_OFFSET}`;
}

function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function toTimeLabel(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function buildFutureTimes(now = new Date()) {
  return {
    glucose: toTimeLabel(addMinutes(now, 35)),
    weight: toTimeLabel(addMinutes(now, 55)),
    bloodPressure: toTimeLabel(addMinutes(now, 75)),
    medication1: addMinutes(now, 95),
    medication2: addMinutes(now, 115),
    mealReminder: addMinutes(now, 50),
    mealEaten: addMinutes(now, 10),
  };
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const email = resolveTestEmail();
const dateKey = todayDateKey();
const times = buildFutureTimes();

try {
  await client.connect();

  const userResult = await client.query(
    "select id from auth.users where email = $1 limit 1",
    [email],
  );

  if (userResult.rows.length === 0) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const userId = userResult.rows[0].id;
  console.log(`Seeding notifications for ${email} (${userId}) on ${dateKey}`);

  await client.query("begin");

  await client.query(
    `update public.settings
     set notifications_enabled = true,
         notify_glucose = true,
         notify_medications = true,
         notify_weight = true,
         notify_blood_pressure = true,
         notify_glucose_times = $2::text[],
         notify_glucose_time = $3,
         notify_weight_times = $4::text[],
         notify_weight_time = $5,
         notify_blood_pressure_times = $6::text[],
         notify_blood_pressure_time = $7,
         notify_medications_repeat_count = 1,
         updated_at = now()
     where user_id = $1`,
    [
      userId,
      [times.glucose, toTimeLabel(addMinutes(new Date(), 140))],
      times.glucose,
      [times.weight],
      times.weight,
      [times.bloodPressure],
      times.bloodPressure,
    ],
  );

  await client.query(
    `delete from public.meal_logs
     where user_id = $1
       and eaten_at >= $2::timestamptz
       and eaten_at < $2::date + interval '1 day'`,
    [userId, at(dateKey, "00:00")],
  );

  await client.query(
    `insert into public.meal_logs (user_id, eaten_at, meal_text, remind_at, reminder_sent)
     values ($1, $2::timestamptz, $3, $4::timestamptz, false)`,
    [
      userId,
      times.mealEaten.toISOString(),
      "Йогурт с фруктами",
      times.mealReminder.toISOString(),
    ],
  );

  const medsResult = await client.query(
    `select id, name
     from public.medications
     where user_id = $1 and is_active = true
     order by created_at asc
     limit 2`,
    [userId],
  );

  if (medsResult.rows.length === 0) {
    console.warn("No active medications found. Daily reminders will still appear.");
  } else {
    const futureSlots = [times.medication1, times.medication2];

    for (let index = 0; index < medsResult.rows.length; index += 1) {
      const medication = medsResult.rows[index];
      const scheduledFor = futureSlots[index] ?? addMinutes(new Date(), 130 + index * 20);

      await client.query(
        `insert into public.medication_logs
           (user_id, medication_id, scheduled_for, status, note)
         values ($1, $2, $3::timestamptz, 'pending', $4)
         on conflict (medication_id, scheduled_for)
         do update set status = 'pending', taken_at = null, note = excluded.note`,
        [
          userId,
          medication.id,
          scheduledFor.toISOString(),
          "Демо-напоминание для тестового аккаунта",
        ],
      );
    }
  }

  await client.query("commit");

  console.log("Notification demo enabled:");
  console.log(`  glucose: ${times.glucose}, ${toTimeLabel(addMinutes(new Date(), 140))}`);
  console.log(`  weight: ${times.weight}`);
  console.log(`  blood pressure: ${times.bloodPressure}`);
  console.log(`  meal reminder: ${toTimeLabel(times.mealReminder)}`);
  console.log(`  medications: ${medsResult.rows.length} pending log(s)`);
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
