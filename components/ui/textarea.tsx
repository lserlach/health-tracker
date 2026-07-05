"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={textareaId} className="text-sm font-semibold text-muted-foreground">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "min-h-24 w-full rounded-(--radius-button) border-0 bg-background px-4 py-3 text-base text-field-foreground md:text-sm",
            "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            error && "ring-2 ring-danger/30",
            className,
          )}
          {...props}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
