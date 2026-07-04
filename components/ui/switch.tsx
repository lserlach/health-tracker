import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  icon?: ReactNode;
  labelClassName?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { checked, onCheckedChange, label, description, icon, labelClassName, className, disabled, ...props },
    ref,
  ) => (
    <div className={cn("flex items-start justify-between gap-4", icon && "items-center", className)}>
      {(label || description || icon) && (
        <div className={cn("min-w-0 flex-1", icon && "flex items-center gap-3")}>
          {icon}
          {(label || description) && (
            <div className="min-w-0">
              {label ? (
                <p className={cn("font-medium text-foreground", labelClassName ?? "text-sm")}>{label}</p>
              ) : null}
              {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
            </div>
          )}
        </div>
      )}

      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "disabled:pointer-events-none disabled:opacity-50",
          checked ? "bg-primary" : "bg-border",
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  ),
);

Switch.displayName = "Switch";
