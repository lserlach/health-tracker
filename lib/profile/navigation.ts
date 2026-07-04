import type { SupabaseClient } from "@supabase/supabase-js";
import { getEarliestNavigationDate, toDateKey } from "@/lib/dates/day";

export async function getMinDateKeyForUser(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_menstrual_date, tracking_start_date")
    .eq("id", userId)
    .maybeSingle();

  return toDateKey(
    getEarliestNavigationDate({
      lastMenstrualDate: profile?.last_menstrual_date,
      trackingStartDate: profile?.tracking_start_date,
    }),
  );
}
