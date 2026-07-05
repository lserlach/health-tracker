"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DotsThreeVertical, PencilSimple, Trash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

interface RecordActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
  className?: string;
}

export function RecordActionButtons({
  onEdit,
  onDelete,
  editLabel = "Редактировать",
  deleteLabel = "Удалить",
  className,
}: RecordActionButtonsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleEdit() {
    setOpen(false);
    onEdit();
  }

  function handleDelete() {
    setOpen(false);
    onDelete();
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
        aria-label="Действия"
      >
        <DotsThreeVertical size={20} weight="bold" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Действия с записью"
          className="absolute right-0 top-full z-20 mt-1 min-w-40 overflow-hidden rounded-(--radius-button) border border-border bg-card py-1 shadow-lg shadow-primary/10"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleEdit}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
          >
            <PencilSimple size={16} aria-hidden />
            {editLabel}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/12"
          >
            <Trash size={16} aria-hidden />
            {deleteLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
