"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  GENDER_LABELS,
  activityOptions,
  goalOptions,
} from "@/lib/app-data";
import { useDiary } from "@/lib/diary";
import { parseAmountInput } from "@/lib/nutrition";
import { loadUnits, saveUnits, type Units } from "@/lib/storage";
import type { ActivityLevel, Gender, Goal } from "@/lib/types";
import { SettingRow } from "./SettingRow";
import { SettingsSection } from "./SettingsSection";
import { ThemeSelector } from "./ThemeSelector";

interface Option<T extends string> {
  value: T;
  label: string;
}

const FIELD_CLASSES =
  "w-24 rounded-xl border border-transparent bg-foreground/[0.05] px-2.5 py-2 text-right text-[15px] tabular-nums text-foreground outline-none transition-[background-color,border-color,box-shadow] focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10";

const SELECT_CLASSES =
  "appearance-none rounded-xl border border-transparent bg-foreground/[0.05] py-2 pl-3 pr-8 text-[15px] text-foreground outline-none transition-[background-color,border-color,box-shadow] focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10";

/** Text input that commits a valid positive number on blur/Enter. */
function NumberField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number | null;
  onCommit: (value: number) => void;
}) {
  const [text, setText] = useState(value === null ? "" : String(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(value === null ? "" : String(value));
  }, [value]);

  function commit() {
    const parsed = parseAmountInput(text);
    if (parsed !== null && parsed > 0) {
      setInvalid(false);
      if (parsed !== value) onCommit(parsed);
    } else {
      setInvalid(true);
      setText(value === null ? "" : String(value));
      window.setTimeout(() => setInvalid(false), 1200);
    }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      aria-label={label}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={
        invalid
          ? "w-24 rounded-xl border border-red-500/60 bg-foreground/[0.05] px-2.5 py-2 text-right text-[15px] tabular-nums text-foreground outline-none focus:ring-4 focus:ring-red-500/10"
          : FIELD_CLASSES
      }
    />
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value as T)}
        className={SELECT_CLASSES}
      >
        {value === null && (
          <option value="" disabled>
            Не указано
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/** Settings screen with all values persisted to localStorage. */
export function SettingsForm() {
  const { ready, profile, targets, setProfile, setTargets } = useDiary();
  const [units, setUnits] = useState<Units>("metric");

  useEffect(() => {
    setUnits(loadUnits());
  }, []);

  if (!ready) return <LoadingState />;

  const genderOptions: Option<Gender>[] = [
    { value: "male", label: GENDER_LABELS.male },
    { value: "female", label: GENDER_LABELS.female },
  ];
  const activitySelectOptions: Option<ActivityLevel>[] = activityOptions.map(
    ({ value, label }) => ({ value, label }),
  );
  const goalSelectOptions: Option<Goal>[] = goalOptions.map(
    ({ value, label }) => ({ value, label }),
  );

  return (
    <>
      <PageHeader
        title="Настройки"
        subtitle="Профиль, цели и параметры приложения"
      />
      <p className="-mt-3 mb-6 text-[13px] text-muted-foreground">
        Все изменения сохраняются автоматически
      </p>

      <div className="space-y-7">
        <SettingsSection title="Профиль">
          <SettingRow label="Пол">
            <SelectField
              label="Пол"
              value={profile.gender}
              options={genderOptions}
              onChange={(gender) => setProfile({ ...profile, gender })}
            />
          </SettingRow>
          <SettingRow label="Возраст">
            <NumberField
              label="Возраст"
              value={profile.age}
              onCommit={(age) => setProfile({ ...profile, age })}
            />
            <span className="w-7 text-right text-sm text-muted-foreground">
              лет
            </span>
          </SettingRow>
          <SettingRow label="Рост">
            <NumberField
              label="Рост"
              value={profile.height}
              onCommit={(height) => setProfile({ ...profile, height })}
            />
            <span className="w-7 text-right text-sm text-muted-foreground">
              см
            </span>
          </SettingRow>
          <SettingRow label="Вес">
            <NumberField
              label="Вес"
              value={profile.weight}
              onCommit={(weight) => setProfile({ ...profile, weight })}
            />
            <span className="w-7 text-right text-sm text-muted-foreground">
              кг
            </span>
          </SettingRow>
          <SettingRow label="Активность">
            <SelectField
              label="Активность"
              value={profile.activity}
              options={activitySelectOptions}
              onChange={(activity) => setProfile({ ...profile, activity })}
            />
          </SettingRow>
          <SettingRow label="Цель">
            <SelectField
              label="Цель"
              value={profile.goal}
              options={goalSelectOptions}
              onChange={(goal) => setProfile({ ...profile, goal })}
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Питание">
          <SettingRow label="Калории">
            <NumberField
              label="Дневная норма калорий"
              value={targets.calories}
              onCommit={(calories) => setTargets({ ...targets, calories })}
            />
            <span className="w-10 text-right text-sm text-muted-foreground">
              ккал
            </span>
          </SettingRow>
          <SettingRow label="Белки">
            <NumberField
              label="Белки"
              value={targets.protein}
              onCommit={(protein) => setTargets({ ...targets, protein })}
            />
            <span className="w-7 text-right text-sm text-muted-foreground">
              г
            </span>
          </SettingRow>
          <SettingRow label="Жиры">
            <NumberField
              label="Жиры"
              value={targets.fat}
              onCommit={(fat) => setTargets({ ...targets, fat })}
            />
            <span className="w-7 text-right text-sm text-muted-foreground">
              г
            </span>
          </SettingRow>
          <SettingRow label="Углеводы">
            <NumberField
              label="Углеводы"
              value={targets.carbs}
              onCommit={(carbs) => setTargets({ ...targets, carbs })}
            />
            <span className="w-7 text-right text-sm text-muted-foreground">
              г
            </span>
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Приложение">
          <div className="px-5 py-4 sm:px-6">
            <p className="mb-2.5 text-[15px] text-foreground">Тема</p>
            <ThemeSelector />
          </div>

          <SettingRow label="Единицы измерения">
            <div className="relative">
              <select
                value={units}
                aria-label="Единицы измерения"
                onChange={(event) => {
                  const next = event.target.value as Units;
                  setUnits(next);
                  saveUnits(next);
                }}
                className={SELECT_CLASSES}
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
