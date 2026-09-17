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
        subtitle="База продуктов с пищевой ценностью на 100 грамм"
      />
      <FoodsExplorer />
    </>
  );
}
