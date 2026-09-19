"use client";

import { useEffect, useState } from "react";
import { Calculator, ChevronDown, PencilLine } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  GENDER_LABELS,
  activityOptions,
  goalOptions,
} from "@/lib/app-data";
import { useDiary } from "@/lib/diary";
import { formatNumber } from "@/lib/format";
import { profileFieldError } from "@/lib/goals";
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

const MODE_SWITCH_CLASSES =
  "flex-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors";

const VALUE_CLASSES = "text-[15px] tabular-nums text-foreground";

interface NumberFieldProps {
  label: string;
  value: number | null;
  onCommit: (value: number) => void;
  /** Boundary validation returning a Russian error message or null. */
  validate?: (value: number) => string | null;
  /** Reports the current validation state for the row error line. */
  onError?: (message: string | null) => void;
}

/** Text input that commits a valid number in range on blur/Enter. */
function NumberField({
  label,
  value,
  onCommit,
  validate,
  onError,
}: NumberFieldProps) {
  const [text, setText] = useState(value === null ? "" : String(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(value === null ? "" : String(value));
  }, [value]);

  function commit() {
    const parsed = parseAmountInput(text);
    const message =
      parsed === null ? "Введите число" : (validate?.(parsed) ?? null);
    if (parsed !== null && message === null) {
      setInvalid(false);
      onError?.(null);
      if (parsed !== value) onCommit(parsed);
    } else {
      setInvalid(true);
      onError?.(message ?? "Введите число");
      setText(value === null ? "" : String(value));
      window.setTimeout(() => {
        setInvalid(false);
        onError?.(null);
      }, 2500);
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

/** Read-only value with a unit, for automatically calculated targets. */
function StaticValue({ value, unit }: { value: number; unit: string }) {
  return (
    <span className={VALUE_CLASSES}>
      {formatNumber(value)}
      <span className="ml-1 text-sm text-muted-foreground">{unit}</span>
    </span>
  );
}

/**
 * Settings screen with all values persisted to localStorage. Profile
 * changes recalculate the daily targets in auto mode («Автоматически
 * рассчитано»); manual targets are an explicit choice and are never
 * overwritten by profile edits.
 */
export function SettingsForm() {
  const {
    ready,
    profile,
    manualTargets,
    goals,
    targetMode,
    setProfile,
    setTargets,
    setTargetMode,
  } = useDiary();
  const [units, setUnits] = useState<Units>("metric");
  const [ageError, setAgeError] = useState<string | null>(null);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);

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
  const goalLabel =
    profile.goal !== null
      ? (goalOptions.find((option) => option.value === profile.goal)?.label ??
        null)
      : null;

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
        <SettingsSection title="Параметры">
          <SettingRow label="Пол">
            <SelectField
              label="Пол"
              value={profile.gender}
              options={genderOptions}
              onChange={(gender) => setProfile({ ...profile, gender })}
            />
          </SettingRow>
          <SettingRow label="Возраст" error={ageError}>
            <NumberField
              label="Возраст"
              value={profile.age}
              validate={(value) => profileFieldError("age", value)}
              onError={setAgeError}
              onCommit={(age) => setProfile({ ...profile, age })}
            />
            <span className="w-7 text-right text-sm text-muted-foreground">
              лет
            </span>
          </SettingRow>
          <SettingRow label="Рост" error={heightError}>
            <NumberField
              label="Рост"
              value={profile.height}
              validate={(value) => profileFieldError("height", value)}
              onError={setHeightError}
              onCommit={(height) => setProfile({ ...profile, height })}
            />
            <span className="w-7 text-right text-sm text-muted-foreground">
              см
            </span>
          </SettingRow>
          <SettingRow label="Вес" error={weightError}>
            <NumberField
              label="Вес"
              value={profile.weight}
              validate={(value) => profileFieldError("weight", value)}
              onError={setWeightError}
              onCommit={(weight) => setProfile({ ...profile, weight })}
            />
            <span className="w-7 text-right text-sm text-muted-foreground">
              кг
            </span>
          </SettingRow>
          <SettingRow label="Уровень активности">
            <SelectField
              label="Уровень активности"
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

        <SettingsSection title="Цели питания">
          <div className="px-5 pt-4 sm:px-6">
            <div
              className="flex gap-1 rounded-xl bg-foreground/[0.05] p-1"
              role="group"
              aria-label="Режим целей питания"
            >
              <button
                type="button"
                aria-pressed={targetMode === "auto"}
                onClick={() => setTargetMode("auto")}
                className={`${MODE_SWITCH_CLASSES} ${
                  targetMode === "auto"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calculator className="mr-1.5 inline h-4 w-4" />
                Автоматически
              </button>
              <button
                type="button"
                aria-pressed={targetMode === "manual"}
                onClick={() => setTargetMode("manual")}
                className={`${MODE_SWITCH_CLASSES} ${
                  targetMode === "manual"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PencilLine className="mr-1.5 inline h-4 w-4" />
                Вручную
              </button>
            </div>
          </div>

          {targetMode === "auto" ? (
            goals ? (
              <>
                <p className="px-5 pt-3 text-[13px] font-medium text-primary sm:px-6">
                  Автоматически рассчитано
                </p>
                <SettingRow label="Калории">
                  <StaticValue value={goals.calories} unit="ккал" />
                </SettingRow>
                <SettingRow label="Белки">
                  <StaticValue value={goals.protein} unit="г" />
                </SettingRow>
                <SettingRow label="Жиры">
                  <StaticValue value={goals.fat} unit="г" />
                </SettingRow>
                <SettingRow label="Углеводы">
                  <StaticValue value={goals.carbs} unit="г" />
                </SettingRow>
                <p className="px-5 pb-4 text-[13px] leading-relaxed text-muted-foreground sm:px-6">
                  Базовый обмен: {formatNumber(goals.bmr)} ккал
                  <br />
                  Суточная потребность: {formatNumber(goals.tdee)} ккал
                  {goalLabel && (
                    <>
                      <br />
                      Цель: {goalLabel}
                    </>
                  )}
                </p>
              </>
            ) : (
              <p className="px-5 py-4 text-[13px] leading-relaxed text-muted-foreground sm:px-6">
                Заполните параметры профиля, чтобы рассчитать вашу
                дневную норму калорий: пол, возраст, рост, вес, уровень
                активности и цель.
              </p>
            )
          ) : (
            <>
              <SettingRow label="Калории">
                <NumberField
                  label="Дневная норма калорий"
                  value={manualTargets.calories}
                  onCommit={(calories) =>
                    setTargets({ ...manualTargets, calories })
                  }
                />
                <span className="w-10 text-right text-sm text-muted-foreground">
                  ккал
                </span>
              </SettingRow>
              <SettingRow label="Белки">
                <NumberField
                  label="Белки"
                  value={manualTargets.protein}
                  onCommit={(protein) =>
                    setTargets({ ...manualTargets, protein })
                  }
                />
                <span className="w-7 text-right text-sm text-muted-foreground">
                  г
                </span>
              </SettingRow>
              <SettingRow label="Жиры">
                <NumberField
                  label="Жиры"
                  value={manualTargets.fat}
                  onCommit={(fat) => setTargets({ ...manualTargets, fat })}
                />
                <span className="w-7 text-right text-sm text-muted-foreground">
                  г
                </span>
              </SettingRow>
              <SettingRow label="Углеводы">
                <NumberField
                  label="Углеводы"
                  value={manualTargets.carbs}
                  onCommit={(carbs) => setTargets({ ...manualTargets, carbs })}
                />
                <span className="w-7 text-right text-sm text-muted-foreground">
                  г
                </span>
              </SettingRow>
              <p className="px-5 pb-4 text-[13px] leading-relaxed text-muted-foreground sm:px-6">
                Цели заданы вручную и не зависят от параметров профиля.
              </p>
            </>
          )}
        </SettingsSection>

        <SettingsSection title="Внешний вид">
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

        <p className="mt-6 px-1 text-xs leading-relaxed text-muted-foreground">
          Данные о брендовых продуктах предоставлены Open Food Facts
          (openfoodfacts.org) — открытой базой данных продуктов под
          лицензией ODbL.
        </p>
      </div>
    </>
  );
}
