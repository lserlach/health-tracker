import { CaretDown } from "@phosphor-icons/react";
import { parseMealItems } from "@/features/glucose/lib/validation";

interface MealItemsDisclosureProps {
  mealText: string;
}

export function MealItemsDisclosure({ mealText }: MealItemsDisclosureProps) {
  const items = parseMealItems(mealText).filter(Boolean);
  if (items.length === 0) return null;

  return (
    <details className="group border-t border-border/60 pt-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
        <CaretDown
          size={14}
          className="shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
        Съедено
        <span className="font-normal text-muted-foreground/75">({items.length})</span>
      </summary>
      <ul className="mt-2 space-y-1 border-l border-border/60 pl-3">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="text-sm text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}
