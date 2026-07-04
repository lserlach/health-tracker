import { WeightPageClient } from "@/features/weight/components/weight-page-client";
import { getMinDateKeyForUser } from "@/lib/profile/navigation";
import { createClient } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/dates/day";

export default async function WeightPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const minDateKey = user ? await getMinDateKeyForUser(supabase, user.id) : toDateKey(new Date());

  return <WeightPageClient minDateKey={minDateKey} />;
}
