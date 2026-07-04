"use client";

import { Bell, Cookie, UserCircle, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

export type SettingsTab = "profile" | "limits" | "notifications";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

const tabs: { id: SettingsTab; label: string; icon: Icon }[] = [
  { id: "profile", label: "Профиль", icon: UserCircle },
  { id: "limits", label: "Лимиты", icon: Cookie },
  { id: "notifications", label: "Уведомления", icon: Bell },
];

export function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  return (
    <div
      className="mb-4 grid grid-cols-3 gap-1 rounded-full border-0 bg-card p-1 shadow-[0_0_10px_rgba(146,121,255,0.12)]"
      role="tablist"
      aria-label="Разделы настроек"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-white shadow-sm shadow-primary/15"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onChange(tab.id)}
          >
            <IconComponent size={16} weight={isActive ? "fill" : "regular"} aria-hidden />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
