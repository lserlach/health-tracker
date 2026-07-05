"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { parseMealItems, serializeMealItems } from "@/features/glucose/lib/validation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

interface MealItemsInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}

const MAX_VISIBLE_ITEMS = 4;

export function MealItemsInput({ value, onChange, onBlur, error }: MealItemsInputProps) {
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<string[]>(() => parseMealItems(value));
  const [itemIds, setItemIds] = useState<string[]>(() => [`${listId}-0`]);
  const isScrollable = items.length > MAX_VISIBLE_ITEMS;

  useEffect(() => {
    const parsed = parseMealItems(value);
    setItems(parsed);
    setItemIds(parsed.map((_, index) => `${listId}-${index}`));
  }, [value, listId]);

  function handleItemChange(index: number, nextValue: string) {
    const nextItems = [...items];
    nextItems[index] = nextValue;
    setItems(nextItems);
    onChange(serializeMealItems(nextItems));
  }

  function handleAddItem() {
    const nextItems = [...items, ""];
    setItems(nextItems);
    setItemIds((current) => [...current, `${listId}-${current.length}`]);

    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  function handleRemoveItem(index: number) {
    if (items.length <= 1) return;

    const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(nextItems);
    setItemIds((current) => current.filter((_, itemIndex) => itemIndex !== index));
    onChange(serializeMealItems(nextItems));
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-muted-foreground">Что ели</span>
        {items.length > 1 ? (
          <span className="text-xs text-muted-foreground/80">{items.length} продуктов</span>
        ) : null}
      </div>

      <div
        ref={listRef}
        className={cn(
          "space-y-2",
          isScrollable &&
            "max-h-60 overflow-y-auto overscroll-y-contain rounded-(--radius-button) border border-border/50 bg-background/50 p-2",
        )}
      >
        {items.map((item, index) => (
          <div key={itemIds[index] ?? `${listId}-${index}`} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Input
                placeholder={index === 0 ? "Овсянка" : "Яблоко"}
                value={item}
                onChange={(event) => handleItemChange(index, event.target.value)}
                onBlur={onBlur}
                error={index === 0 ? error : undefined}
              />
            </div>
            {items.length > 1 ? (
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-danger transition-colors hover:bg-danger/12"
                aria-label="Удалить продукт"
                onClick={() => handleRemoveItem(index)}
              >
                <Trash size={18} aria-hidden />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddItem}
        className={cn(
          "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-(--radius-button)",
          "border border-dashed border-primary/35 bg-transparent px-4 text-sm font-medium text-primary",
          "transition-colors hover:bg-primary-soft/40",
        )}
      >
        <Plus size={14} weight="bold" aria-hidden />
        Добавить продукт
      </button>
    </div>
  );
}
