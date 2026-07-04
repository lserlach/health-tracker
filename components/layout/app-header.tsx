import Link from "next/link";
import { ReactNode } from "react";
import { FilePdf, Gear } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils/cn";

interface AppHeaderProps {
  title: string;
  showActions?: boolean;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function AppHeader({
  title,
  showActions = false,
  actions,
  className,
  children,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "mb-4 flex items-center justify-between gap-3",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {children}
      </div>
      {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
      {showActions ? (
        <div className="flex items-center gap-1">
          <Link
            href="/reports"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
            aria-label="Отчёты"
          >
            <FilePdf size={22} weight="regular" />
          </Link>
          <Link
            href="/settings"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
            aria-label="Настройки"
          >
            <Gear size={22} weight="regular" />
          </Link>
        </div>
      ) : null}
    </header>
  );
}
