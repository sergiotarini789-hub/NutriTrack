import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { PageHeader } from "@/components/ui/PageHeader";
import { todayFullLabel } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Сегодня",
};

export default function TodayPage() {
  return (
    <>
      <PageHeader title="Сегодня" subtitle={todayFullLabel} />
      <Dashboard />
    </>
  );
}
