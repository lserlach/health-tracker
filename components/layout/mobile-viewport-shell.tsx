"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MobileViewport } from "@/components/layout/mobile-viewport";

const FULLSCREEN_PATH_PREFIXES = ["/reports/test/preview"];

interface MobileViewportShellProps {
  children: ReactNode;
}

export function MobileViewportShell({ children }: MobileViewportShellProps) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isFullscreen) {
    return <div className="min-h-dvh w-full">{children}</div>;
  }

  return <MobileViewport>{children}</MobileViewport>;
}
