import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-12 w-full rounded-(--radius-button) border border-border bg-card px-4 text-base text-foreground",
            "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            error && "border-red-300 focus-visible:ring-red-200",
            className,
          )}
          {...props}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  },
);

Input.displayName = "Input";
