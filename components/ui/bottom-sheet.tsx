"use client";

import { ReactNode, useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

interface BottomSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[1.25rem] bg-card p-4 shadow-xl",
          "pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h2
              className={cn(
                "text-xl font-semibold text-foreground",
                subtitle && "font-heading leading-tight",
              )}
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-primary-soft"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
