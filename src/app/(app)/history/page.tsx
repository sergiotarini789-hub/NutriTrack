import type { Metadata } from "next";
import { HistoryDayCard } from "@/components/history/HistoryDayCard";
import { WeeklyOverview } from "@/components/history/WeeklyOverview";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { historyDays } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "История",
};

export default function HistoryPage() {
  // Newest first
  const days = [...historyDays].reverse();

  return (
    <>
      <PageHeader
        title="История"
        subtitle="Ваша динамика питания за последние дни"
      />

      <div className="space-y-6">
        <WeeklyOverview />

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            По дням
          </h2>
          <Card className="divide-y divide-border">
            {days.map((day) => (
              <HistoryDayCard key={day.id} day={day} />
            ))}
          </Card>
        </section>
      </div>
    </>
  );
}
