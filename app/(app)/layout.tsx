import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
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

  const allowedEmail = process.env.ALLOWED_EMAIL?.trim().toLowerCase();
  if (allowedEmail && user.email?.toLowerCase() !== allowedEmail) {
    await supabase.auth.signOut();
    redirect("/login?error=unauthorized");
  }

  return (
    <>
      <main className="flex min-h-full flex-col">{children}</main>
      <BottomNav />
    </>
  );
}
