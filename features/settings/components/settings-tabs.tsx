"use client";

import { cn } from "@/lib/utils/cn";

export type SettingsTab = "profile" | "limits" | "notifications";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

const tabs: { id: SettingsTab; label: string }[] = [
  { id: "profile", label: "Профиль" },
  { id: "limits", label: "Лимиты" },
  { id: "notifications", label: "Уведомления" },
];

export function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  return (
    <div
      className="mb-4 grid grid-cols-3 gap-1 rounded-full border-0 bg-card p-1 shadow-none"
      role="tablist"
      aria-label="Разделы настроек"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-full px-1.5 py-2 text-base font-medium leading-tight transition-colors",
              isActive
                ? "bg-primary text-white shadow-sm shadow-primary/15"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
