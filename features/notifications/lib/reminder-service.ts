import { sendPushNotification } from "@/features/notifications/lib/send-push";
import {
  buildDailyReminderKey,
  buildMedicationReminderKey,
  clampRepeatCount,
  isExactReminderWindowActive,
  normalizeNotificationTimes,
  NOTIFICATION_CRON_INTERVAL_MINUTES,
  parseNotificationTime,
} from "@/features/notifications/lib/notification-schedule";
import { createServiceClient } from "@/lib/supabase/service";

const TIMEZONE = process.env.REMINDER_TIMEZONE ?? "Europe/Moscow";
const TZ_OFFSET = process.env.REMINDER_TZ_OFFSET ?? "+03:00";

interface ReminderCandidate {
  key: string;
  title: string;
  body: string;
  url: string;
}

interface LocalDateTime {
  dateKey: string;
  hour: number;
  minute: number;
}

function getLocalDateTime(date = new Date()): LocalDateTime {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";

  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function getDayBounds(dateKey: string) {
  return {
    start: new Date(`${dateKey}T00:00:00.000${TZ_OFFSET}`).toISOString(),
    end: new Date(`${dateKey}T23:59:59.999${TZ_OFFSET}`).toISOString(),
  };
}

async function wasReminderSent(userId: string, reminderKey: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("notification_reminders_sent")
    .select("id")
    .eq("user_id", userId)
    .eq("reminder_key", reminderKey)
    .maybeSingle();

  return Boolean(data);
}

async function markReminderSent(userId: string, reminderKey: string) {
  const supabase = createServiceClient();
  await supabase.from("notification_reminders_sent").insert({ user_id: userId, reminder_key: reminderKey });
}

async function sendReminderToUser(userId: string, reminder: ReminderCandidate) {
  const supabase = createServiceClient();

  if (await wasReminderSent(userId, reminder.key)) {
    return;
  }

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions?.length) {
    return;
  }

  let sent = false;

  for (const subscription of subscriptions) {
    try {
      await sendPushNotification(subscription, {
        title: reminder.title,
        body: reminder.body,
        url: reminder.url,
      });
      sent = true;
    } catch {
      await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
    }
  }

  if (sent) {
    await markReminderSent(userId, reminder.key);
  }
}

function appendDailyReminders(
  reminders: ReminderCandidate[],
  input: {
    enabled: boolean;
    type: string;
    times: string[];
    fallbackTime: string;
    title: string;
    body: string;
    dateKey: string;
    hour: number;
    minute: number;
  },
) {
  if (!input.enabled) {
    return;
  }

  for (const time of normalizeNotificationTimes(input.times, input.fallbackTime)) {
    const { hour: targetHour, minute: targetMinute } = parseNotificationTime(time);

    if (!isExactReminderWindowActive(input.hour, input.minute, targetHour, targetMinute)) {
      continue;
    }

    reminders.push({
      key: buildDailyReminderKey(input.type, input.dateKey, time),
      title: input.title,
      body: input.body,
      url: "/",
    });
  }
}

export async function runReminderCron() {
  const supabase = createServiceClient();
  const local = getLocalDateTime();
  const { start, end } = getDayBounds(local.dateKey);

  const { data: settingsRows, error } = await supabase
    .from("settings")
    .select("*")
    .eq("notifications_enabled", true);

  if (error) {
    throw new Error(error.message);
  }

  let sentCount = 0;

  for (const settings of settingsRows ?? []) {
    const userId = settings.user_id;
    const reminders: ReminderCandidate[] = [];

    appendDailyReminders(reminders, {
      enabled: settings.notify_glucose,
      type: "glucose",
      times: settings.notify_glucose_times,
      fallbackTime: settings.notify_glucose_time,
      title: "Измерь сахар",
      body: "Пора измерить сахар",
      dateKey: local.dateKey,
      hour: local.hour,
      minute: local.minute,
    });

    appendDailyReminders(reminders, {
      enabled: settings.notify_weight,
      type: "weight",
      times: settings.notify_weight_times,
      fallbackTime: settings.notify_weight_time,
      title: "Измерь вес",
      body: "Пора измерить вес",
      dateKey: local.dateKey,
      hour: local.hour,
      minute: local.minute,
    });

    appendDailyReminders(reminders, {
      enabled: settings.notify_blood_pressure,
      type: "blood_pressure",
      times: settings.notify_blood_pressure_times,
      fallbackTime: settings.notify_blood_pressure_time,
      title: "Измерь давление",
      body: "Пора измерить давление",
      dateKey: local.dateKey,
      hour: local.hour,
      minute: local.minute,
    });

    if (settings.notify_medications) {
      const repeatCount = clampRepeatCount(settings.notify_medications_repeat_count);
      const { data: pendingLogs } = await supabase
        .from("medication_logs")
        .select("id, scheduled_for, medications(name)")
        .eq("user_id", userId)
        .eq("status", "pending")
        .gte("scheduled_for", start)
        .lte("scheduled_for", end)
        .lte("scheduled_for", new Date().toISOString());

      for (const log of pendingLogs ?? []) {
        const scheduledAt = new Date(log.scheduled_for);
        const overdueMinutes = (Date.now() - scheduledAt.getTime()) / 60000;
        if (overdueMinutes < 0) continue;

        for (let slot = 0; slot < repeatCount; slot += 1) {
          const slotStart = slot * NOTIFICATION_CRON_INTERVAL_MINUTES;
          const slotEnd = slotStart + NOTIFICATION_CRON_INTERVAL_MINUTES;
          if (overdueMinutes < slotStart || overdueMinutes >= slotEnd) continue;

          const medicationName =
            (log.medications as { name?: string } | null)?.name ?? "лекарство";

          reminders.push({
            key: buildMedicationReminderKey(log.id, slot),
            title: "Отметь приём",
            body: `Пора отметить приём: ${medicationName}`,
            url: "/medications",
          });
        }
      }
    }

    for (const reminder of reminders) {
      await sendReminderToUser(userId, reminder);
      sentCount += 1;
    }
  }

  const { data: dueMeals } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("reminder_sent", false)
    .lte("remind_at", new Date().toISOString());

  for (const meal of dueMeals ?? []) {
    const { data: settings } = await supabase
      .from("settings")
      .select("notifications_enabled")
      .eq("user_id", meal.user_id)
      .maybeSingle();

    if (!settings?.notifications_enabled) continue;

    const { count } = await supabase
      .from("glucose_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", meal.user_id)
      .eq("measurement_type", "after_meal")
      .gte("measured_at", meal.eaten_at);

    if ((count ?? 0) > 0) {
      await supabase.from("meal_logs").update({ reminder_sent: true }).eq("id", meal.id);
      continue;
    }

    const reminderKey = `meal:${meal.id}`;
    if (await wasReminderSent(meal.user_id, reminderKey)) {
      await supabase.from("meal_logs").update({ reminder_sent: true }).eq("id", meal.id);
      continue;
    }

    await sendReminderToUser(meal.user_id, {
      key: reminderKey,
      title: "Измерь сахар",
      body: `Пора измерить сахар после еды: ${meal.meal_text}`,
      url: "/glucose",
    });

    await supabase.from("meal_logs").update({ reminder_sent: true }).eq("id", meal.id);
    sentCount += 1;
  }

  return { sentCount, checkedUsers: settingsRows?.length ?? 0 };
}
