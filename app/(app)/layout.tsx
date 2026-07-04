import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main className="flex min-h-full flex-col">{children}</main>
      <BottomNav />
    </>
  );
}
