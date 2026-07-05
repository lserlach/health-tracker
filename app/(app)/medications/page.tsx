import { MedicationsPageClient } from "@/features/medications/components/medications-page-client";
import { getMedicationLogsForDayAction } from "@/features/medications/actions/medication-log-actions";
import type { MedicationLogWithMedication } from "@/features/medications/services/generate-daily-logs";
import { getMinDateKeyForUser } from "@/lib/profile/navigation";
import { createClient } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/dates/day";

export default async function MedicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialDateKey = toDateKey();
  const minDateKey = user ? await getMinDateKeyForUser(supabase, user.id) : initialDateKey;
  const initialLogs: MedicationLogWithMedication[] = user
    ? (await getMedicationLogsForDayAction(initialDateKey)).data ?? []
    : [];

  return (
    <MedicationsPageClient
      minDateKey={minDateKey}
      initialDateKey={initialDateKey}
      initialLogs={initialLogs}
    />
  );
}
