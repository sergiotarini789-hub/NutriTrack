import { CalendarDays, History, Settings, UtensilsCrossed } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/today", label: "Сегодня", icon: CalendarDays },
  { href: "/foods", label: "Продукты", icon: UtensilsCrossed },
  { href: "/history", label: "История", icon: History },
  { href: "/settings", label: "Настройки", icon: Settings },
] as const;
