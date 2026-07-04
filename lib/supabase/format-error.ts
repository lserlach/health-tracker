import type { PostgrestError } from "@supabase/supabase-js";

export function formatSupabaseError(error: PostgrestError | Error | null | undefined) {
  if (!error) return "Неизвестная ошибка";

  if ("message" in error && error.message.includes("Could not find the table")) {
    return "Таблицы не созданы. Откройте Supabase → SQL Editor → вставьте supabase/full_schema.sql → Run.";
  }

  if ("code" in error && error.code === "42501") {
    return "Нет доступа (RLS). Выйдите и войдите снова.";
  }

  if ("message" in error && error.message) {
    return error.message;
  }

  return "Неизвестная ошибка";
}
