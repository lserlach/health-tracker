import { GlucosePageClient } from "@/features/glucose/components/glucose-page-client";
import { getMinDateKeyForUser } from "@/lib/profile/navigation";
import { createClient } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/dates/day";

export default async function GlucosePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const minDateKey = user ? await getMinDateKeyForUser(supabase, user.id) : toDateKey(new Date());

  return <GlucosePageClient minDateKey={minDateKey} />;
}
