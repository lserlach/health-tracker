import { Clock } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

export function PendingGlucoseBadge() {
  return (
    <Badge variant="warning" className="gap-1">
      <Clock size={14} weight="fill" aria-hidden />
      Не измерено
    </Badge>
  );
}
