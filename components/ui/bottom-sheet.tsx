"use client";

import { ReactNode, useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

interface BottomSheetProps {
  open: boolean;
  title?: string | null;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, title, subtitle, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="app-overlay-scope fixed inset-0 z-[100] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-[1.25rem] bg-card p-4 shadow-xl",
          "pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        {title !== null ? (
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pr-2">
              {title ? (
                <h2
                  className={cn(
                    "text-xl font-semibold text-foreground",
                    subtitle && "font-heading leading-tight",
                  )}
                >
                  {title}
                </h2>
              ) : null}
              {subtitle ? (
                typeof subtitle === "string" ? (
                  <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{subtitle}</p>
                ) : (
                  subtitle
                )
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-primary-soft"
              aria-label="Закрыть"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-primary-soft"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
