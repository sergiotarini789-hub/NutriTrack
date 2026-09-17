import type { Metadata } from "next";
import { FoodsExplorer } from "@/components/foods/FoodsExplorer";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Продукты",
};

export default function FoodsPage() {
  return (
    <>
      <PageHeader
        title="Продукты"
        subtitle="Пищевая ценность на 100 г или 100 мл · значения справочные"
      />
      <FoodsExplorer />
    </>
  );
}
