"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cookie,
  Heartbeat,
  House,
  Pill,
  Scales,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Главная", icon: House },
  { href: "/glucose", label: "Сахар", icon: Cookie },
  { href: "/medications", label: "Лекарства", icon: Pill },
  { href: "/weight", label: "Вес", icon: Scales },
  { href: "/blood-pressure", label: "Давление", icon: Heartbeat },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Основная навигация"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-12 min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-(--radius-button) px-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={22} weight={isActive ? "fill" : "regular"} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
