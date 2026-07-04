import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatSupabaseError } from "@/lib/supabase/format-error";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = (await request.json()) as { endpoint?: string };
  const endpoint = body.endpoint?.trim();

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint не указан" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: formatSupabaseError(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
