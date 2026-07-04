import { MedicationsPageClient } from "@/features/medications/components/medications-page-client";
import { getMinDateKeyForUser } from "@/lib/profile/navigation";
import { createClient } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/dates/day";

export default async function MedicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const minDateKey = user ? await getMinDateKeyForUser(supabase, user.id) : toDateKey(new Date());

  return <MedicationsPageClient minDateKey={minDateKey} />;
}
