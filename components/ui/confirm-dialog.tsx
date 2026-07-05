"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Удалить",
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="app-overlay-scope fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Отмена"
        onClick={onCancel}
      />
      <Card className="relative z-10 w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "..." : confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
