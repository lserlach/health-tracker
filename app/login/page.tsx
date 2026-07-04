import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center text-sm text-muted-foreground">
          Загрузка...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
