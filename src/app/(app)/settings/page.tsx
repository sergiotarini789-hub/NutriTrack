import type { Metadata } from "next";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SettingRow } from "@/components/settings/SettingRow";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { PageHeader } from "@/components/ui/PageHeader";
import { dailyTargets, profileSettings } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Настройки",
};

const profileRows = [
  { label: "Возраст", value: profileSettings.age },
  { label: "Рост", value: profileSettings.height },
  { label: "Вес", value: profileSettings.weight },
  { label: "Пол", value: profileSettings.gender },
  { label: "Уровень активности", value: profileSettings.activity },
  { label: "Цель", value: profileSettings.goal },
];

const nutritionRows = [
  { label: "Дневная норма калорий", value: dailyTargets.calories, unit: "ккал" },
  { label: "Белки", value: dailyTargets.protein, unit: "г" },
  { label: "Жиры", value: dailyTargets.fat, unit: "г" },
  { label: "Углеводы", value: dailyTargets.carbs, unit: "г" },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Настройки"
        subtitle="Профиль, цели и параметры приложения"
      />

      <div className="space-y-7">
        <SettingsSection title="Профиль">
          {profileRows.map((row) => (
            <SettingRow key={row.label} label={row.label}>
              <span className="text-[15px] text-muted-foreground">
                {row.value}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </SettingRow>
          ))}
        </SettingsSection>

        <SettingsSection title="Питание">
          {nutritionRows.map((row) => (
            <SettingRow key={row.label} label={row.label}>
              <input
                type="text"
                inputMode="numeric"
                defaultValue={row.value}
                aria-label={row.label}
                className="w-20 rounded-lg border border-border bg-card px-2.5 py-1.5 text-right text-[15px] tabular-nums text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="w-8 text-right text-sm text-muted-foreground">
                {row.unit}
              </span>
            </SettingRow>
          ))}
        </SettingsSection>

        <SettingsSection title="Приложение">
          <SettingRow label="Тёмная тема">
            <ThemeToggle />
          </SettingRow>

          <SettingRow label="Единицы измерения">
            <div className="relative">
              <select
                defaultValue="metric"
                aria-label="Единицы измерения"
                className="appearance-none rounded-lg border border-border bg-card py-1.5 pl-3 pr-8 text-[15px] text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="metric">Метрическая</option>
                <option value="imperial">Имперская</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </SettingRow>
        </SettingsSection>
      </div>
    </>
  );
}
