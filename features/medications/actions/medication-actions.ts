"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser, ensureUserRecords } from "@/lib/supabase/auth-helpers";
import { formatSupabaseError } from "@/lib/supabase/format-error";
import {
  medicationFormSchema,
  type MedicationFormValues,
} from "@/features/medications/lib/validation";
import type { Medication } from "@/types/database.types";

function mapForm(values: MedicationFormValues, userId: string) {
  return {
    user_id: userId,
    name: values.name.trim(),
    dosage: values.dosage.trim(),
    icon: values.icon,
    intake_relation: values.intake_relation,
    times_per_day: values.times_per_day,
    schedule_times: values.schedule_times,
    is_active: values.is_active,
  };
}

export async function getMedicationsAction() {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError, data: [] as Medication[] };

  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: formatSupabaseError(error), data: [] as Medication[] };
  return { data: (data ?? []) as Medication[] };
}

export async function saveMedicationAction(values: MedicationFormValues, id?: string) {
  const parsed = medicationFormSchema.safeParse(values);
  if (!parsed.success) return { error: "Проверьте введённые значения" };

  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  await ensureUserRecords(user.id, user.email ?? "");

  const payload = mapForm(parsed.data, user.id);
  const { error } = id
    ? await supabase.from("medications").update(payload).eq("id", id)
    : await supabase.from("medications").insert(payload);

  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/medications");
  revalidatePath("/medications/manage");
  revalidatePath("/");
  return { success: true };
}

export async function deleteMedicationAction(id: string) {
  const { supabase, user, error: authError } = await getAuthenticatedUser();
  if (!user) return { error: authError };

  const { error } = await supabase.from("medications").delete().eq("id", id);
  if (error) return { error: formatSupabaseError(error) };

  revalidatePath("/medications");
  revalidatePath("/medications/manage");
  revalidatePath("/");
  return { success: true };
}
