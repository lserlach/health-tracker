import { ForkKnife, SunHorizon } from "@phosphor-icons/react";
import type { GlucoseMeasurementType } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { getMeasurementTypeLabel } from "@/features/glucose/lib/validation";

const badgeStyles: Record<GlucoseMeasurementType, string> = {
  fasting: "bg-fasting-badge-bg text-fasting-badge-fg",
  after_meal: "bg-primary/12 text-primary",
};

const iconProps = { size: 14, weight: "fill" as const };

function MeasurementIcon({ type }: { type: GlucoseMeasurementType }) {
  switch (type) {
    case "fasting":
      return <SunHorizon {...iconProps} aria-hidden />;
    case "after_meal":
      return <ForkKnife {...iconProps} aria-hidden />;
  }
}

interface GlucoseMeasurementBadgeProps {
  type: GlucoseMeasurementType;
}

export function GlucoseMeasurementBadge({ type }: GlucoseMeasurementBadgeProps) {
  return (
    <Badge className={badgeStyles[type]}>
      <MeasurementIcon type={type} />
      {getMeasurementTypeLabel(type)}
    </Badge>
  );
}
