import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: error?.message ?? "Не авторизован" };
  }

  return { supabase, user, error: null };
}

export async function ensureUserRecords(userId: string, email: string, login?: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: userId,
      email,
      login: login ?? null,
    });
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!settings) {
    await supabase.from("settings").insert({ user_id: userId });
  }
}
