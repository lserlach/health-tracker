import { createClient } from "@/lib/supabase/server";
import { SettingsPageClient } from "@/features/settings/components/settings-page-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileRes, settingsRes] = await Promise.all([
    user
      ? supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <SettingsPageClient
      email={user?.email ?? "—"}
      initialProfile={profileRes.data ?? null}
      initialSettings={settingsRes.data ?? null}
    />
  );
}
