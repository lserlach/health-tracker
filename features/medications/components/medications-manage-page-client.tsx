"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "@phosphor-icons/react";
import {
  deleteMedicationAction,
  getMedicationsAction,
  saveMedicationAction,
} from "@/features/medications/actions/medication-actions";
import { MedicationForm } from "@/features/medications/components/medication-form";
import { getIntakeRelationLabel } from "@/features/medications/lib/validation";
import type { MedicationFormValues } from "@/features/medications/lib/validation";
import type { Medication } from "@/types/database.types";
import { AppHeader } from "@/components/layout/app-header";
import { FixedBottomAction } from "@/components/layout/fixed-bottom-action";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { RecordActionButtons } from "@/components/ui/record-action-buttons";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";

export function MedicationsManagePageClient() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medication | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  async function load() {
    const result = await getMedicationsAction();
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      setMedications([]);
      return;
    }
    setMedications(result.data);
  }

  useEffect(() => {
    void load();
  }, []);

  function openSheet(medication?: Medication) {
    setEditing(medication ?? null);
    setSheetOpen(true);
  }

  async function onSubmit(values: MedicationFormValues) {
    const result = await saveMedicationAction(values, editing?.id);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }

    if (result.data) {
      setMedications((current) =>
        editing
          ? current.map((medication) =>
              medication.id === editing.id ? result.data! : medication,
            )
          : [result.data, ...current],
      );
    }

    setToast({
      message: editing ? "Лекарство обновлено" : "Лекарство добавлено",
      variant: "success",
    });
    setSheetOpen(false);
  }

  return (
    <PageContainer>
      <AppHeader
        title="Расписание"
        actions={
          <Link
            href="/medications"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
            aria-label="Назад к чек-листу"
          >
            <ArrowLeft size={22} />
          </Link>
        }
      />

      {medications.length === 0 ? (
        <EmptyState
          title="Лекарств пока нет"
          description="Добавьте первое лекарство с временем приёма."
          action={<Button onClick={() => openSheet()}>Добавить</Button>}
        />
      ) : (
        <div className="space-y-3">
          {medications.map((medication) => {
            const times = (medication.schedule_times as string[]).join(", ");
            return (
              <Card key={medication.id} className="border-0 shadow-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading font-semibold">{medication.name}</p>
                      {!medication.is_active ? <Badge variant="muted">Неактивно</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {medication.dosage} · {times}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getIntakeRelationLabel(medication.intake_relation)}
                    </p>
                  </div>
                  <RecordActionButtons
                    onEdit={() => openSheet(medication)}
                    onDelete={() => setDeleteTarget(medication)}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <FixedBottomAction>
        <Button className="w-full shadow-lg shadow-primary/20" onClick={() => openSheet()}>
          <Plus size={16} weight="bold" />
          Добавить лекарство
        </Button>
      </FixedBottomAction>

      <BottomSheet
        open={sheetOpen}
        title={editing ? "Редактировать" : "Добавить лекарство"}
        onClose={() => setSheetOpen(false)}
      >
        <MedicationForm
          key={editing?.id ?? "new"}
          initialData={editing ?? undefined}
          onSubmit={onSubmit}
          onCancel={() => setSheetOpen(false)}
        />
      </BottomSheet>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Удалить лекарство?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;

          const deletedMedication = deleteTarget;
          setMedications((current) =>
            current.filter((medication) => medication.id !== deletedMedication.id),
          );
          setDeleteTarget(null);

          const result = await deleteMedicationAction(deletedMedication.id);
          if (result.error) {
            setMedications((current) => [deletedMedication, ...current]);
            setToast({ message: result.error, variant: "error" });
            return;
          }

          setToast({ message: "Лекарство удалено", variant: "success" });
        }}
      />

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </PageContainer>
  );
}
