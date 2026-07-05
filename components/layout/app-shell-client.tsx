"use client";

import { ReactNode, useRef } from "react";
import { BottomActionSlotRefContext } from "@/components/layout/bottom-action-context";
import { BottomNav } from "@/components/layout/bottom-nav";

interface AppShellClientProps {
  children: ReactNode;
}

export function AppShellClient({ children }: AppShellClientProps) {
  const bottomActionSlotRef = useRef<HTMLDivElement>(null);

  return (
    <BottomActionSlotRefContext.Provider value={bottomActionSlotRef}>
      <div className="flex h-full min-h-dvh flex-col bg-background md:min-h-0">
        <div className="flex flex-1 flex-col overflow-y-auto overscroll-y-contain">
          <main className="flex min-h-full flex-1 flex-col">{children}</main>
        </div>
        <div
          ref={bottomActionSlotRef}
          className="shrink-0 empty:hidden [&:not(:empty)]:border-t [&:not(:empty)]:border-border/60 [&:not(:empty)]:bg-background [&:not(:empty)]:px-4 [&:not(:empty)]:pb-3 [&:not(:empty)]:pt-3"
        />
        <BottomNav />
      </div>
    </BottomActionSlotRefContext.Provider>
  );
}
