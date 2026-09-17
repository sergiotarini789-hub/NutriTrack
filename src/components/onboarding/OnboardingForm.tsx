"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Mars, Venus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { activityOptions, goalOptions } from "@/lib/app-data";
import { cn } from "@/lib/cn";
import { parseAmountInput } from "@/lib/nutrition";
import { loadOnboarded, saveOnboarded, saveProfile } from "@/lib/storage";
import type { ActivityLevel, Gender, Goal } from "@/lib/types";

const STEPS = [
  { title: "Ваш пол", description: "Это нужно для расчёта нормы калорий" },
  { title: "Ваши параметры", description: "Укажите возраст, рост и вес" },
  {
    title: "Уровень активности",
    description: "Насколько вы активны в течение недели",
  },
  { title: "Ваша цель", description: "Что вы хотите достичь вместе с NutriTrack" },
] as const;

interface OptionRowProps {
  label: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
}

function OptionRow({ label, description, icon: Icon, selected, onClick }: OptionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left transition-[background-color,box-shadow] duration-150 active:scale-[0.99] sm:p-4",
        selected
          ? "bg-primary/[0.07] ring-2 ring-primary"
          : "bg-card ring-1 ring-border/70 hover:bg-foreground/[0.03]",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          selected
            ? "bg-primary/10 text-primary"
            : "bg-foreground/[0.06] text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-primary bg-primary" : "border-muted-foreground/40",
        )}
      >
        {selected && (
          <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3.5} />
        )}
      </span>
    </button>
  );
}

interface GenderOptionProps {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
}

function GenderOption({ label, icon: Icon, selected, onClick }: GenderOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl p-5 transition-[background-color,box-shadow] duration-150 active:scale-[0.98] sm:p-6",
        selected
          ? "bg-primary/[0.07] ring-2 ring-primary"
          : "bg-card ring-1 ring-border/70 hover:bg-foreground/[0.03]",
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          selected
            ? "bg-primary/10 text-primary"
            : "bg-foreground/[0.06] text-muted-foreground",
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="text-[15px] font-medium text-foreground">{label}</span>
    </button>
  );
}

interface BodyParams {
  age: string;
  height: string;
  weight: string;
}

/** First-launch profile setup wizard. Saves the profile locally. */
export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender | null>(null);
  const [params, setParams] = useState<BodyParams>({
    age: "",
    height: "",
    weight: "",
  });
  const [touched, setTouched] = useState<Record<keyof BodyParams, boolean>>({
    age: false,
    height: false,
    weight: false,
  });
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  // Already completed onboarding — go straight to the app.
  useEffect(() => {
    if (loadOnboarded()) router.replace("/today");
  }, [router]);

  const setParam = (field: keyof BodyParams) => (value: string) =>
    setParams((current) => ({ ...current, [field]: value }));
  const blurParam = (field: keyof BodyParams) => () =>
    setTouched((current) => ({ ...current, [field]: true }));

  const parsedAge = parseAmountInput(params.age);
  const parsedHeight = parseAmountInput(params.height);
  const parsedWeight = parseAmountInput(params.weight);
  const ageValid = parsedAge !== null && parsedAge > 0;
  const heightValid = parsedHeight !== null && parsedHeight > 0;
  const weightValid = parsedWeight !== null && parsedWeight > 0;

  const isLastStep = step === STEPS.length - 1;
  const canContinue =
    step === 0
      ? gender !== null
      : step === 1
        ? ageValid && heightValid && weightValid
        : step === 2
          ? activity !== null
          : goal !== null;

  function handleContinue() {
    if (isLastStep) {
      saveProfile({
        gender,
        age: parsedAge,
        height: parsedHeight,
        weight: parsedWeight,
        activity,
        goal,
      });
      saveOnboarded();
      router.push("/today");
    } else {
      setTouched({ age: false, height: false, weight: false });
      setStep((current) => current + 1);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Logo />
        <span className="text-sm tabular-nums text-muted-foreground">
          Шаг {step + 1} из {STEPS.length}
        </span>
      </header>

      {/* Step progress */}
      <div className="mt-5 flex gap-1.5" aria-hidden="true">
        {STEPS.map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              index <= step ? "bg-primary" : "bg-foreground/10",
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div key={step} className="animate-step-in mt-8 flex-1 sm:mt-12">
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">
          {STEPS[step].title}
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
          {STEPS[step].description}
        </p>

        <div className="mt-7">
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              <GenderOption
                label="Мужчина"
                icon={Mars}
                selected={gender === "male"}
                onClick={() => setGender("male")}
              />
              <GenderOption
                label="Женщина"
                icon={Venus}
                selected={gender === "female"}
                onClick={() => setGender("female")}
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="Возраст"
                unit="лет"
                placeholder="Например, 28"
                inputMode="decimal"
                value={params.age}
                onChange={(event) => setParam("age")(event.target.value)}
                onBlur={blurParam("age")}
                error={touched.age && !ageValid ? "Введите число больше 0" : null}
              />
              <Input
                label="Рост"
                unit="см"
                placeholder="Например, 178"
                inputMode="decimal"
                value={params.height}
                onChange={(event) => setParam("height")(event.target.value)}
                onBlur={blurParam("height")}
                error={touched.height && !heightValid ? "Введите число больше 0" : null}
              />
              <Input
                label="Вес"
                unit="кг"
                placeholder="Например, 76"
                inputMode="decimal"
                value={params.weight}
                onChange={(event) => setParam("weight")(event.target.value)}
                onBlur={blurParam("weight")}
                error={touched.weight && !weightValid ? "Введите число больше 0" : null}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2.5">
              {activityOptions.map((option) => (
                <OptionRow
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  icon={option.icon}
                  selected={activity === option.value}
                  onClick={() => setActivity(option.value)}
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2.5">
              {goalOptions.map((option) => (
                <OptionRow
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  icon={option.icon}
                  selected={goal === option.value}
                  onClick={() => setGoal(option.value)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setStep((current) => current - 1)}
            aria-label="Назад"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <Button
          size="lg"
          className="flex-1"
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Продолжить
        </Button>
      </div>
    </div>
  );
}
