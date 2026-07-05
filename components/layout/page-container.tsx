import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden px-4 pb-4 pt-4",
        "pt-[max(1rem,env(safe-area-inset-top))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
