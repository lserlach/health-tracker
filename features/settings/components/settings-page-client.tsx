"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { Clock, Cookie, Heartbeat, Pill, Scales, type Icon } from "@phosphor-icons/react";
import { saveSettingsAction } from "@/features/settings/actions/settings-actions";
import {
  getPushSupportStatus,
  scheduleTestPushNotification,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/features/notifications/lib/push-client";
import {
  DUPLICATE_NOTIFICATION_TIME_MESSAGE,
  profileToFormValues,
  settingsFormSchema,
  type SettingsFormValues,
} from "@/features/settings/lib/validation";
import type { Profile, Settings } from "@/types/database.types";
import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { NotificationTimesEditor } from "@/features/settings/components/notification-times-editor";
import { SettingsTabs, type SettingsTab } from "@/features/settings/components/settings-tabs";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Toast } from "@/components/ui/toast";

function formatNotificationTimesLabel(times?: string[]) {
  const valid = (times ?? []).map((time) => time?.trim()).filter(Boolean);
  return valid.length > 0 ? valid.join(", ") : null;
}

function getFirstFormErrorMessage(errors: FieldErrors<SettingsFormValues>): string | null {
  const queue: unknown[] = [errors];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;

    if ("message" in current && typeof current.message === "string") {
      return current.message;
    }

    for (const value of Object.values(current)) {
      if (value) queue.push(value);
    }
  }

  return null;
}

interface SettingsPageClientProps {
  initialProfile: Profile | null;
  initialSettings: Settings | null;
}

type NotificationTimesFieldName =
  | "notify_glucose_times"
  | "notify_weight_times"
  | "notify_blood_pressure_times";

const notificationSections: {
  name:
    | "notify_glucose"
    | "notify_medications"
    | "notify_weight"
    | "notify_blood_pressure";
  timesName?: NotificationTimesFieldName;
  label: string;
  reminderTitle?: string;
  reminderSubtitle?: string;
  hasTime: boolean;
  icon: Icon;
}[] = [
  {
    name: "notify_glucose",
    timesName: "notify_glucose_times",
    label: "Напоминание о сахаре",
    reminderTitle: "Сахар",
    reminderSubtitle: "Напоминание в выбранное время. Можно указать несколько времён.",
    hasTime: true,
    icon: Cookie,
  },
  {
    name: "notify_medications",
    label: "Напоминание о лекарствах",
    hasTime: false,
    icon: Pill,
  },
  {
    name: "notify_weight",
    timesName: "notify_weight_times",
    label: "Напоминание о весе",
    reminderTitle: "Вес",
    reminderSubtitle: "Напоминание в выбранное время. Можно указать несколько времён.",
    hasTime: true,
    icon: Scales,
  },
  {
    name: "notify_blood_pressure",
    timesName: "notify_blood_pressure_times",
    label: "Напоминание о давлении",
    reminderTitle: "Давление",
    reminderSubtitle: "Напоминание в выбранное время. Можно указать несколько времён.",
    hasTime: true,
    icon: Heartbeat,
  },
];

export function SettingsPageClient({
  initialProfile,
  initialSettings,
}: SettingsPageClientProps) {
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null,
  );
  const [testPushPending, setTestPushPending] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [timesEditorSection, setTimesEditorSection] = useState<NotificationTimesFieldName | null>(
    null,
  );
  const [timesEditorDraft, setTimesEditorDraft] = useState<string[] | null>(null);
  const [timesEditorError, setTimesEditorError] = useState<string | null>(null);
  const pushSupported = getPushSupportStatus();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { isSubmitting, errors },
  } = useForm<SettingsFormValues>({
    defaultValues: profileToFormValues(initialProfile, initialSettings),
    resolver: zodResolver(settingsFormSchema),
    mode: "onChange",
  });

  const notificationsEnabled = watch("notifications_enabled");

  function openTimesEditor(sectionName: NotificationTimesFieldName) {
    setTimesEditorDraft([...watch(sectionName)]);
    setTimesEditorError(null);
    setTimesEditorSection(sectionName);
  }

  function cancelTimesEditor() {
    if (timesEditorSection && timesEditorDraft) {
      setValue(timesEditorSection, timesEditorDraft, { shouldValidate: true });
    }
    setTimesEditorSection(null);
    setTimesEditorDraft(null);
    setTimesEditorError(null);
  }

  async function saveTimesEditor() {
    if (!timesEditorSection) return;

    const isValid = await trigger(timesEditorSection);
    if (!isValid) {
      setTimesEditorError(DUPLICATE_NOTIFICATION_TIME_MESSAGE);
      return;
    }

    setTimesEditorError(null);
    setTimesEditorSection(null);
    setTimesEditorDraft(null);
  }

  async function onSubmit(values: SettingsFormValues) {
    setFormSubmitError(null);

    if (values.notifications_enabled) {
      const subscribeResult = await subscribeToPushNotifications();
      if (subscribeResult.error) {
        setFormSubmitError(subscribeResult.error);
        return;
      }
    } else {
      await unsubscribeFromPushNotifications();
    }

    const result = await saveSettingsAction(values);
    if (result.error) {
      setFormSubmitError(result.error);
      return;
    }

    setToast({ message: "Настройки сохранены", variant: "success" });
  }

  async function handleNotificationsToggle(checked: boolean) {
    const previousEnabled = getValues("notifications_enabled");
    const previousNotifyGlucose = getValues("notify_glucose");
    const previousNotifyMedications = getValues("notify_medications");
    const previousNotifyWeight = getValues("notify_weight");
    const previousNotifyBloodPressure = getValues("notify_blood_pressure");

    setValue("notifications_enabled", checked, { shouldDirty: true });

    if (!checked) {
      setValue("notify_glucose", false);
      setValue("notify_medications", false);
      setValue("notify_weight", false);
      setValue("notify_blood_pressure", false);
      setTimesEditorSection(null);
      setTimesEditorDraft(null);
    }

    try {
      if (checked) {
        if (!pushSupported) {
          throw new Error("Push-уведомления не поддерживаются в этом браузере");
        }

        const result = await subscribeToPushNotifications();
        if (result.error) {
          throw new Error(result.error);
        }
      } else {
        await unsubscribeFromPushNotifications();
      }
    } catch (error) {
      setValue("notifications_enabled", previousEnabled, { shouldDirty: true });
      setValue("notify_glucose", previousNotifyGlucose);
      setValue("notify_medications", previousNotifyMedications);
      setValue("notify_weight", previousNotifyWeight);
      setValue("notify_blood_pressure", previousNotifyBloodPressure);
      setToast({
        message: error instanceof Error ? error.message : "Не удалось изменить уведомления",
        variant: "error",
      });
    }
  }

  async function handleTestPushNotification() {
    if (testPushPending) return;

    const result = await scheduleTestPushNotification();
    if (result.error) {
      setToast({ message: result.error, variant: "error" });
      return;
    }

    setTestPushPending(true);
    setToast({
      message: "Тестовое уведомление придёт через 1 минуту. Не закрывайте приложение.",
      variant: "success",
    });

    window.setTimeout(() => {
      setTestPushPending(false);
    }, 60_000);
  }

  return (
    <PageContainer>
      <AppHeader title="Настройки" />

      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

      <form
        className="space-y-6"
        onSubmit={handleSubmit(onSubmit, (fieldErrors) => {
          setFormSubmitError(
            getFirstFormErrorMessage(fieldErrors) ?? "Проверьте введённые значения",
          );
        })}
      >
        {activeTab === "profile" ? (
          <Card flat className="space-y-4">
            <h2 className="text-base font-medium text-foreground">Профиль</h2>
            <Input label="Имя (для отчёта)" {...register("display_name")} />
            <Input
              label="Стартовый вес, кг"
              type="number"
              step="0.1"
              {...register("start_weight")}
            />
            <Input
              label="Первый день последней менструации"
              type="date"
              {...register("last_menstrual_date")}
            />
            <Input
              label="Начало ведения дневника"
              type="date"
              {...register("tracking_start_date")}
            />
          </Card>
        ) : null}

        {activeTab === "limits" ? (
          <Card flat className="space-y-4">
            <h2 className="text-base font-medium text-foreground">Лимиты сахара, ммоль/л</h2>
            <Input
              label="Натощак"
              type="number"
              step="0.1"
              {...register("glucose_fasting_limit", { valueAsNumber: true })}
            />
            <Input
              label="После еды"
              type="number"
              step="0.1"
              {...register("glucose_after_meal_limit", { valueAsNumber: true })}
            />
          </Card>
        ) : null}

        {activeTab === "notifications" ? (
          <Card flat className="space-y-5">
            <div>
              <h2 className="text-base font-medium text-foreground">Уведомления</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Push-напоминания, когда нужно внести данные в дневник.
              </p>
            </div>

            <Controller
              name="notifications_enabled"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    void handleNotificationsToggle(checked);
                  }}
                  label="Включить уведомления"
                  description={
                    pushSupported
                      ? "Разрешите уведомления в браузере и добавьте приложение на экран"
                      : "В этом браузере push-уведомления недоступны"
                  }
                  disabled={!pushSupported}
                />
              )}
            />

            {notificationsEnabled ? (
              <div className="space-y-5 border-t border-border pt-4">
                {notificationSections.map((section) => {
                  const isSectionEnabled = watch(section.name);
                  const configuredTimesLabel =
                    section.timesName != null
                      ? formatNotificationTimesLabel(watch(section.timesName))
                      : null;

                  return (
                    <div key={section.name} className="space-y-3">
                      <Controller
                        name={section.name}
                        control={control}
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            label={section.label}
                            labelClassName="text-base"
                            icon={
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft/45 text-primary">
                                <section.icon size={20} weight="fill" aria-hidden />
                              </div>
                            }
                          />
                        )}
                      />

                      {isSectionEnabled ? (
                        section.hasTime && section.timesName ? (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                              onClick={() => openTimesEditor(section.timesName!)}
                            >
                              <Clock size={16} aria-hidden />
                              Настроить
                            </button>
                            {configuredTimesLabel ? (
                              <p className="text-sm text-muted-foreground">{configuredTimesLabel}</p>
                            ) : null}
                          </div>
                        ) : (
                          <Link
                            href="/medications/manage"
                            className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            <Clock size={16} aria-hidden />
                            Настроить
                          </Link>
                        )
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {notificationsEnabled ? (
              <div className="border-t border-border pt-4">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={!pushSupported || testPushPending}
                onClick={() => {
                  void handleTestPushNotification();
                }}
              >
                {testPushPending ? "Ожидаем уведомление..." : "Выпустить уведомление"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Отправит тестовый push через 1 минуту. Для проверки оставьте приложение открытым.
              </p>
              </div>
            ) : null}
          </Card>
        ) : null}

        <FormError message={formSubmitError} />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем..." : "Сохранить"}
        </Button>
      </form>

      {activeTab === "profile" ? (
        <div className="mt-6">
          <SignOutButton />
        </div>
      ) : null}

      <Toast message={toast?.message ?? null} variant={toast?.variant} onClose={() => setToast(null)} />

      {notificationSections.map((section) =>
        section.timesName ? (
          <BottomSheet
            key={section.timesName}
            open={timesEditorSection === section.timesName}
            title={section.reminderTitle ?? "Напоминания"}
            subtitle={section.reminderSubtitle}
            onClose={cancelTimesEditor}
          >
            <FormError message={timesEditorError} className="mb-4" />
            <NotificationTimesEditor
              control={control}
              register={register}
              name={section.timesName}
            />
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 border-0 bg-primary-soft/45 hover:bg-primary-soft/60"
                onClick={cancelTimesEditor}
              >
                Отменить
              </Button>
              <Button type="button" className="flex-1" onClick={() => void saveTimesEditor()}>
                Сохранить
              </Button>
            </div>
          </BottomSheet>
        ) : null,
      )}
    </PageContainer>
  );
}
