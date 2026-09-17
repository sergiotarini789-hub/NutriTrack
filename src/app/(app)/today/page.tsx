import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata: Metadata = {
  title: "Сегодня",
};

export default function TodayPage() {
  return <Dashboard />;
}
