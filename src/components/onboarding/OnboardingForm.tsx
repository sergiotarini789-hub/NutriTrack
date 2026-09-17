"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Mars, Venus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { activityOptions, goalOptions } from "@/lib/mock-data";
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
        "flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-colors sm:p-4",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-foreground/[0.03]",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          selected
            ? "bg-primary/10 text-primary"
            : "bg-foreground/5 text-muted-foreground",
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
        "flex flex-col items-center gap-3 rounded-2xl border p-5 transition-colors sm:p-6",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-foreground/[0.03]",
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          selected
            ? "bg-primary/10 text-primary"
            : "bg-foreground/5 text-muted-foreground",
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="text-[15px] font-medium text-foreground">{label}</span>
    </button>
  );
}

/** First-launch profile setup wizard. */
export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender | null>(null);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  const isLastStep = step === STEPS.length - 1;
  const canContinue =
    step === 1 ||
    (step === 0
      ? gender !== null
      : step === 2
        ? activity !== null
        : goal !== null);

  function handleContinue() {
    if (isLastStep) {
      router.push("/today");
    } else {
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
              "h-1.5 flex-1 rounded-full",
              index <= step ? "bg-primary" : "bg-foreground/10",
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div key={step} className="animate-step-in mt-8 flex-1 sm:mt-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
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
                inputMode="numeric"
              />
              <Input
                label="Рост"
                unit="см"
                placeholder="Например, 178"
                inputMode="numeric"
              />
              <Input
                label="Вес"
                unit="кг"
                placeholder="Например, 76"
                inputMode="numeric"
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
