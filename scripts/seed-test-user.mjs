/**
 * Seed demo data for the local "test" account (3 days).
 * Usage: node scripts/seed-test-user.mjs
 * Requires DATABASE_URL in env (.env.local).
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

function dayKeys(count = 3) {
  const keys = [];
  const today = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    keys.push(date.toISOString().slice(0, 10));
  }
  return keys;
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
const days = dayKeys(3);

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
  console.log(`Seeding user ${email} (${userId}) for ${days.join(", ")}`);

  await client.query("begin");

  const tables = [
    "medication_logs",
    "medications",
    "glucose_logs",
    "weight_logs",
    "blood_pressure_logs",
    "meal_logs",
  ];

  for (const table of tables) {
    await client.query(`delete from public.${table} where user_id = $1`, [userId]);
  }

  const lmpDate = "2026-01-18";
  const dueDate = "2026-10-25";

  await client.query(
    `update public.profiles
     set login = 'test',
         display_name = 'Тестовый аккаунт',
         start_weight = 68.50,
         tracking_start_date = $2::date,
         last_menstrual_date = $3::date,
         due_date = $4::date,
         updated_at = now()
     where id = $1`,
    [userId, days[0], lmpDate, dueDate],
  );

  const medRows = [
    {
      name: "Метформин",
      dosage: "500 мг",
      icon: "pill",
      intake_relation: "with_food",
      times_per_day: 2,
      schedule_times: ["08:00", "20:00"],
    },
    {
      name: "Фолиевая кислота",
      dosage: "400 мкг",
      icon: "pill",
      intake_relation: "before_food",
      times_per_day: 1,
      schedule_times: ["09:00"],
    },
  ];

  const medicationIds = [];

  for (const med of medRows) {
    const result = await client.query(
      `insert into public.medications
         (user_id, name, dosage, icon, intake_relation, times_per_day, schedule_times, is_active)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, true)
       returning id`,
      [
        userId,
        med.name,
        med.dosage,
        med.icon,
        med.intake_relation,
        med.times_per_day,
        JSON.stringify(med.schedule_times),
      ],
    );
    medicationIds.push({ id: result.rows[0].id, ...med });
  }

  const glucosePlan = {
    [days[0]]: [
      { time: "07:30", value: 4.8, type: "fasting" },
      { time: "13:00", value: 6.2, type: "after_meal", meal: "Курица с рисом", minutes: 60 },
      { time: "19:30", value: 7.8, type: "after_meal", meal: "Суп и хлеб", minutes: 90 },
      { time: "22:00", value: 5.1, type: "fasting" },
    ],
    [days[1]]: [
      { time: "07:15", value: 5.3, type: "fasting" },
      { time: "12:45", value: 6.5, type: "after_meal", meal: "Овсянка с ягодами", minutes: 60 },
      { time: "21:45", value: 4.9, type: "fasting" },
    ],
    [days[2]]: [
      { time: "08:00", value: 4.6, type: "fasting" },
      { time: "13:15", value: 5.8, type: "after_meal", meal: "Салат и тост", minutes: 75 },
    ],
  };

  for (const [dateKey, entries] of Object.entries(glucosePlan)) {
    for (const entry of entries) {
      await client.query(
        `insert into public.glucose_logs
           (user_id, measured_at, value, measurement_type, meal_text, minutes_after_meal, note)
         values ($1, $2::timestamptz, $3, $4, $5, $6, $7)`,
        [
          userId,
          at(dateKey, entry.time),
          entry.value,
          entry.type,
          entry.meal ?? null,
          entry.minutes ?? null,
          entry.note ?? null,
        ],
      );
    }
  }

  const weightPlan = {
    [days[0]]: { time: "08:30", weight: 69.2 },
    [days[1]]: { time: "08:15", weight: 69.0 },
    [days[2]]: { time: "08:05", weight: 68.8 },
  };

  for (const [dateKey, entry] of Object.entries(weightPlan)) {
    await client.query(
      `insert into public.weight_logs (user_id, measured_at, weight)
       values ($1, $2::timestamptz, $3)`,
      [userId, at(dateKey, entry.time), entry.weight],
    );
  }

  const bpPlan = {
    [days[0]]: [
      { time: "09:00", systolic: 118, diastolic: 76, pulse: 72 },
      { time: "20:30", systolic: 121, diastolic: 79, pulse: 74 },
    ],
    [days[1]]: [{ time: "09:10", systolic: 122, diastolic: 80, pulse: 75 }],
    [days[2]]: [{ time: "09:05", systolic: 115, diastolic: 74, pulse: 70 }],
  };

  for (const [dateKey, entries] of Object.entries(bpPlan)) {
    for (const entry of entries) {
      await client.query(
        `insert into public.blood_pressure_logs
           (user_id, measured_at, systolic, diastolic, pulse)
         values ($1, $2::timestamptz, $3, $4, $5)`,
        [userId, at(dateKey, entry.time), entry.systolic, entry.diastolic, entry.pulse],
      );
    }
  }

  const mealPlan = [
    { dateKey: days[0], time: "12:00", text: "Курица с рисом" },
    { dateKey: days[0], time: "18:30", text: "Суп и хлеб" },
    { dateKey: days[1], time: "11:45", text: "Овсянка с ягодами" },
    { dateKey: days[2], time: "12:15", text: "Салат и тост" },
  ];

  for (const meal of mealPlan) {
    const eatenAt = at(meal.dateKey, meal.time);
    const remindAt = new Date(new Date(eatenAt).getTime() + 60 * 60 * 1000).toISOString();
    await client.query(
      `insert into public.meal_logs (user_id, eaten_at, meal_text, remind_at, reminder_sent)
       values ($1, $2::timestamptz, $3, $4::timestamptz, true)`,
      [userId, eatenAt, meal.text, remindAt],
    );
  }

  const medicationStatusPlan = {
    [days[0]]: {
      "08:00": "taken",
      "09:00": "taken",
      "20:00": "taken",
    },
    [days[1]]: {
      "08:00": "taken",
      "09:00": "skipped",
      "20:00": "taken",
    },
    [days[2]]: {
      "08:00": "taken",
      "09:00": "pending",
      "20:00": "pending",
    },
  };

  for (const [dateKey, statuses] of Object.entries(medicationStatusPlan)) {
    for (const medication of medicationIds) {
      for (const time of medication.schedule_times) {
        const status = statuses[time] ?? "pending";
        const scheduledFor = at(dateKey, time);
        const takenAt =
          status === "taken"
            ? new Date(new Date(scheduledFor).getTime() + 5 * 60 * 1000).toISOString()
            : null;

        await client.query(
          `insert into public.medication_logs
             (user_id, medication_id, scheduled_for, taken_at, status, note)
           values ($1, $2, $3::timestamptz, $4::timestamptz, $5, $6)`,
          [
            userId,
            medication.id,
            scheduledFor,
            takenAt,
            status,
            status === "skipped" ? "Забыла принять" : null,
          ],
        );
      }
    }
  }

  await client.query("commit");

  const counts = await client.query(
    `select
       (select count(*)::int from public.glucose_logs where user_id = $1) as glucose,
       (select count(*)::int from public.weight_logs where user_id = $1) as weight,
       (select count(*)::int from public.blood_pressure_logs where user_id = $1) as bp,
       (select count(*)::int from public.medications where user_id = $1) as meds,
       (select count(*)::int from public.medication_logs where user_id = $1) as med_logs,
       (select count(*)::int from public.meal_logs where user_id = $1) as meals`,
    [userId],
  );

  console.log("Done:", counts.rows[0]);
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
