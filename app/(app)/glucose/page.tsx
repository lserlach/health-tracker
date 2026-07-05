import { GlucosePageClient } from "@/features/glucose/components/glucose-page-client";
import { getGlucoseDayDataAction } from "@/features/glucose/actions/glucose-actions";
import { getMinDateKeyForUser } from "@/lib/profile/navigation";
import { createClient } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/dates/day";
import type { GlucoseLog, MealLog } from "@/types/database.types";

export default async function GlucosePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialDateKey = toDateKey();
  const minDateKey = user ? await getMinDateKeyForUser(supabase, user.id) : initialDateKey;

  let initialLogs: GlucoseLog[] = [];
  let initialPendingMeals: MealLog[] = [];

  if (user) {
    const initialDayData = await getGlucoseDayDataAction(initialDateKey);
    initialLogs = initialDayData.logs ?? [];
    initialPendingMeals = initialDayData.pendingMeals ?? [];
  }

  return (
    <GlucosePageClient
      minDateKey={minDateKey}
      initialDateKey={initialDateKey}
      initialLogs={initialLogs}
      initialPendingMeals={initialPendingMeals}
    />
  );
}
