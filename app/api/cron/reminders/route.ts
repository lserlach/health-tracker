import { NextResponse } from "next/server";
import { runReminderCron } from "@/features/notifications/lib/reminder-service";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runReminderCron();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reminder cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
