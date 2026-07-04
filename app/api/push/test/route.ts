import { NextResponse } from "next/server";
import { sendPushNotification } from "@/features/notifications/lib/send-push";
import { createClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/format-error";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
  }

  if (!subscriptions?.length) {
    return NextResponse.json({ error: "Нет активной подписки на push" }, { status: 400 });
  }

  let sent = false;
  let lastError: string | null = null;

  for (const subscription of subscriptions) {
    try {
      await sendPushNotification(subscription, {
        title: "Тестовое уведомление",
        body: "Push-уведомления работают. Это проверочное сообщение.",
        url: "/settings",
      });
      sent = true;
    } catch (cause) {
      lastError = cause instanceof Error ? cause.message : "Push delivery failed";
      await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
    }
  }

  if (!sent) {
    return NextResponse.json(
      { error: lastError ?? "Не удалось отправить тестовое уведомление" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
