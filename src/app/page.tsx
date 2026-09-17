import type { Metadata } from "next";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";

export const metadata: Metadata = {
  title: "Начало работы",
};

export default function OnboardingPage() {
  return <OnboardingForm />;
}
