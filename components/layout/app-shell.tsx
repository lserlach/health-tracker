import { ReactNode } from "react";
import { AppShellClient } from "@/components/layout/app-shell-client";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return <AppShellClient>{children}</AppShellClient>;
}
