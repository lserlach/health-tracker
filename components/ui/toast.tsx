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
    <div className="fixed inset-x-4 top-4 z-[120] mx-auto max-w-lg">
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-(--radius-button) px-4 py-3 text-sm shadow-lg",
          variant === "success" && "bg-success text-success-foreground",
          variant === "error" && "bg-red-100 text-red-800",
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
