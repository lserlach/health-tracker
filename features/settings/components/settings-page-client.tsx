"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  getSettingsDataAction,
  saveSettingsAction,
} from "@/features/settings/actions/settings-actions";
import {
  profileToFormValues,
  settingsFormSchema,
  type SettingsFormValues,
} from "@/features/settings/lib/validation";
import type { Profile, Settings } from "@/types/database.types";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

interface SettingsPageClientProps {
  email: string;
  initialProfile: Profile | null;
  initialSettings: Settings | null;
}

export function SettingsPageClient({
  email,
  initialProfile,
  initialSettings,
}: SettingsPageClientProps) {
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );

  const form = useForm<SettingsFormValues>({
    defaultValues: profileToFormValues(initialProfile, initialSettings),
  });

  async function onSubmit(values: SettingsFormValues) {
    const parsed = settingsFormSchema.safeParse(values);
    if (!parsed.success) {
      setToast({ message: "Проверьте введённые значения", variant: "error" });
      return;
    }

    const result = await saveSettingsAction(parsed.data);
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }

    setToast({ message: "Настройки сохранены", variant: "success" });
    void getSettingsDataAction();
  }

  return (
    <PageContainer>
      <AppHeader title="Настройки" />

      <Card className="mb-4 space-y-2 text-sm">
        <p className="text-muted-foreground">Аккаунт</p>
        <p className="font-medium text-foreground">{email}</p>
      </Card>

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="space-y-4">
          <h2 className="text-sm font-medium text-foreground">Профиль</h2>
          <Input label="Имя (для отчёта)" {...form.register("display_name")} />
          <Input
            label="Стартовый вес, кг"
            type="number"
            step="0.1"
            {...form.register("start_weight")}
          />
          <Input
            label="Первый день последней менструации"
            type="date"
            {...form.register("last_menstrual_date")}
          />
          <Input label="ПДР (предполагаемая дата родов)" type="date" {...form.register("due_date")} />
          <Input
            label="Начало ведения дневника"
            type="date"
            {...form.register("tracking_start_date")}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-medium text-foreground">Лимиты сахара, ммоль/л</h2>
          <Input
            label="Натощак"
            type="number"
            step="0.1"
            {...form.register("glucose_fasting_limit", { valueAsNumber: true })}
          />
          <Input
            label="После еды"
            type="number"
            step="0.1"
            {...form.register("glucose_after_meal_limit", { valueAsNumber: true })}
          />
        </Card>

        <Button type="submit" className="w-full">
          Сохранить
        </Button>
      </form>

      <div className="mt-6">
        <SignOutButton />
      </div>

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </PageContainer>
  );
}
