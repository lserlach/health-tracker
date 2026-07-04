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
        "mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-28 pt-4",
        "pt-[max(1rem,env(safe-area-inset-top))]",
        "pb-[max(7rem,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
