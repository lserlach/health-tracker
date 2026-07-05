"use client";

import { cn } from "@/lib/utils/cn";

interface ToastProps {
  message: string | null;
  variant?: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, variant = "success", onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div className="app-toast-scope pointer-events-none fixed inset-x-4 top-4 z-[9999] mx-auto w-[calc(100%-2rem)] pt-[max(0px,env(safe-area-inset-top))]">
      <div
        className={cn(
          "pointer-events-auto flex items-center justify-between gap-3 rounded-(--radius-button) border px-4 py-3 text-sm shadow-lg backdrop-blur-xl backdrop-saturate-150",
          variant === "success" &&
            "border-primary/20 bg-card/92 text-primary shadow-primary/10",
          variant === "error" &&
            "border-danger/20 bg-card/92 text-danger shadow-danger/10",
        )}
      >
        <span>{message}</span>
        <button type="button" onClick={onClose} className="font-medium opacity-70">
          OK
        </button>
      </div>
    </div>
  );
}
