export function formatWeightDelta(delta: number | null) {
  if (delta == null || Number.isNaN(delta)) return "—";

  const formatted = delta.toFixed(1);
  if (delta > 0) return `+${formatted} кг`;
  if (delta < 0) return `${formatted} кг`;
  return "0 кг";
}
