import Link from "next/link";
import { Bell } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TodayNotificationItem } from "@/features/notifications/lib/today-notification-queue";

interface UpcomingNotificationsSectionProps {
  items: TodayNotificationItem[];
  notificationsEnabled: boolean;
  hasActiveRules: boolean;
}

export function UpcomingNotificationsSection({
  items,
  notificationsEnabled,
  hasActiveRules,
}: UpcomingNotificationsSectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Будущие уведомления</h2>

      {items.length > 0 ? (
        <div className="space-y-2">
          {!notificationsEnabled ? (
            <Card className="border-0 shadow-none text-sm text-muted-foreground">
              Напоминания после еды запланированы. Для push включите уведомления в{" "}
              <Link href="/settings" className="font-medium text-primary hover:underline">
                настройках
              </Link>
              .
            </Card>
          ) : null}
          {items.map((item) => (
            <Link key={item.id} href={item.href}>
              <Card className="flex items-center justify-between gap-3 border-0 shadow-none transition-colors hover:bg-primary/12">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Bell size={18} weight="fill" />
                  </div>
                  <span className="truncate text-sm">{item.title}</span>
                </div>
                <Badge variant="success">{item.timeLabel}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      ) : !notificationsEnabled ? (
        <Card className="border-0 shadow-none text-sm text-muted-foreground">
          Push-уведомления выключены.{" "}
          <Link href="/settings" className="font-medium text-primary hover:underline">
            Включить в настройках
          </Link>
        </Card>
      ) : !hasActiveRules ? (
        <Card className="border-0 shadow-none text-sm text-muted-foreground">
          Выберите разделы для напоминаний в{" "}
          <Link href="/settings" className="font-medium text-primary hover:underline">
            настройках
          </Link>
          .
        </Card>
      ) : (
        <Card className="border-0 shadow-none text-sm text-muted-foreground">
          На сегодня больше нет запланированных уведомлений.
        </Card>
      )}
    </section>
  );
}
