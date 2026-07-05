import { cn } from "@/lib/utils/cn";

interface FormErrorProps {
  message?: string | null;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className={cn(
        "rounded-(--radius-button) bg-danger/12 px-3 py-2.5 text-sm text-danger",
        className,
      )}
    >
      {message}
    </p>
  );
}
