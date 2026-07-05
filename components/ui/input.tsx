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
      <div className="flex w-full min-w-0 max-w-full flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-muted-foreground"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-12 w-full min-w-0 max-w-full rounded-(--radius-button) border-0 bg-background px-4 text-base text-field-foreground md:text-sm",
            "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            error && "ring-2 ring-danger/30 focus-visible:ring-danger/30",
            className,
          )}
          {...props}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  },
);

Input.displayName = "Input";
