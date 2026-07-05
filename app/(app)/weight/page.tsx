import { WeightPageClient } from "@/features/weight/components/weight-page-client";
import {
  getWeightLogsForDayAction,
  getWeightStatsAction,
  type WeightStats,
} from "@/features/weight/actions/weight-actions";
import { getMinDateKeyForUser } from "@/lib/profile/navigation";
import { createClient } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/dates/day";
import type { WeightLog } from "@/types/database.types";

export default async function WeightPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialDateKey = toDateKey();
  const minDateKey = user ? await getMinDateKeyForUser(supabase, user.id) : initialDateKey;

  let initialLogs: WeightLog[] = [];
  let initialStats: WeightStats = { gain7Days: null, gainAllTime: null };

  if (user) {
    const [initialLogsResult, initialStatsResult] = await Promise.all([
      getWeightLogsForDayAction(initialDateKey),
      getWeightStatsAction(initialDateKey),
    ]);
    initialLogs = initialLogsResult.data ?? [];
    initialStats = initialStatsResult.data ?? initialStats;
  }

  return (
    <WeightPageClient
      minDateKey={minDateKey}
      initialDateKey={initialDateKey}
      initialLogs={initialLogs}
      initialStats={initialStats}
    />
  );
}
