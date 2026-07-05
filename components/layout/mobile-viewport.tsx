import { ReactNode } from "react";

interface MobileViewportProps {
  children: ReactNode;
}

/** Centers the app in an iPhone 15-sized frame on desktop (393×852 CSS px). */
export function MobileViewport({ children }: MobileViewportProps) {
  return (
    <div className="h-dvh max-w-full overflow-x-hidden overflow-y-hidden bg-background md:h-auto md:min-h-dvh md:overflow-visible md:bg-[#ebe6f8]">
      <div className="app-viewport mx-auto flex h-full w-full max-w-full min-w-0 flex-col overflow-x-hidden overflow-y-hidden bg-background md:fixed md:top-1/2 md:left-1/2 md:h-[min(var(--app-height),100dvh)] md:w-(--app-width) md:min-h-0 md:-translate-x-1/2 md:-translate-y-1/2 md:overflow-hidden md:rounded-(--app-radius) md:border md:border-border md:shadow-[0_24px_80px_rgba(52,46,69,0.14)]">
        {children}
      </div>
    </div>
  );
}
