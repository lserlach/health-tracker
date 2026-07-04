import { endOfDay, startOfDay, subDays } from "date-fns";

export type ReportPeriod = "today" | "7d" | "14d" | "30d" | "all" | "custom";

export const REPORT_PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: "today", label: "Сегодня" },
  { value: "7d", label: "7 дней" },
  { value: "14d", label: "14 дней" },
  { value: "30d", label: "30 дней" },
  { value: "all", label: "Весь период" },
  { value: "custom", label: "Свой период" },
];

export function getReportDateRange(
  period: ReportPeriod,
  customFrom?: string,
  customTo?: string,
  trackingStartDate?: string | null,
) {
  const to = endOfDay(new Date());
  let from: Date;

  switch (period) {
    case "today":
      from = startOfDay(new Date());
      break;
    case "7d":
      from = startOfDay(subDays(new Date(), 6));
      break;
    case "14d":
      from = startOfDay(subDays(new Date(), 13));
      break;
    case "30d":
      from = startOfDay(subDays(new Date(), 29));
      break;
    case "all":
      from = trackingStartDate
        ? startOfDay(new Date(trackingStartDate))
        : startOfDay(subDays(new Date(), 89));
      break;
    case "custom": {
      if (!customFrom || !customTo) {
        from = startOfDay(subDays(new Date(), 6));
        break;
      }
      from = startOfDay(new Date(customFrom));
      return { from, to: endOfDay(new Date(customTo)) };
    }
    default:
      from = startOfDay(subDays(new Date(), 6));
  }

  return { from, to };
}
