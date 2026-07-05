import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { isAllowedAuthEmail } from "@/features/auth/lib/auth-users";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAllowedAuthEmail(user.email ?? "")) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  return <AppShell>{children}</AppShell>;
}
