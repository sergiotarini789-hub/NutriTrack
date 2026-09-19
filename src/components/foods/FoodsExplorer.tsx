"use client";

import { useMemo, useState } from "react";
import { Plus, Search, SearchX, X } from "lucide-react";
import { AddFoodModal } from "@/components/nutrition/AddFoodModal";
import { CustomFoodForm } from "@/components/nutrition/CustomFoodForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { useDiary } from "@/lib/diary";
import {
  ALL_CATEGORY,
  CATEGORIES,
  searchFoods,
} from "@/lib/food-data";
import { formatNumber, pluralize } from "@/lib/format";
import type { FoodItem } from "@/lib/types";
import { CategoryChips, type CategoryChip } from "./CategoryChips";
import { FoodCard } from "./FoodCard";
import { FoodDetailsModal } from "./FoodDetailsModal";

/** Food database screen: search, category filter, details and add flow. */
export function FoodsExplorer() {
  const { allFoods, userFoods } = useDiary();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL_CATEGORY);
  const [detailsFood, setDetailsFood] = useState<FoodItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addFoodId, setAddFoodId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(
    () => searchFoods(allFoods, query, category),
    [allFoods, query, category],
  );

  const categories = useMemo<CategoryChip[]>(() => {
    const base: CategoryChip[] = CATEGORIES.filter(
      (item) => item.id !== "user",
    ).map((item) => ({ id: item.id, name: item.name, icon: item.icon }));
    const list: CategoryChip[] = [{ id: ALL_CATEGORY, name: "Все" }, ...base];
    if (userFoods.length > 0) {
      list.push({
        id: "user",
        name: "Мои продукты",
        icon: CATEGORIES.find((item) => item.id === "user")?.icon,
      });
    }
    return list;
  }, [userFoods]);

  function handleAddToDiary(food: FoodItem) {
    setDetailsFood(null);
    setAddFoodId(food.id);
    setAddOpen(true);
  }

  return (
    <div>
      {/* Search + create */}
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск продукта..."
            aria-label="Поиск продукта"
            className="h-12 w-full rounded-2xl border border-transparent bg-foreground/[0.05] pl-11 pr-11 text-base text-foreground outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Очистить поиск"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          className="h-12 shrink-0 rounded-2xl"
          onClick={() => setCreateOpen(true)}
          aria-label="Создать продукт"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Создать продукт</span>
          <span className="sm:hidden">Создать</span>
        </Button>
      </div>

      {/* Categories */}
      <div className="mt-4">
        <CategoryChips
          categories={categories}
          selected={category}
          onSelect={setCategory}
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {filtered.length > 0
          ? `Найдено: ${formatNumber(filtered.length)} ${pluralize(
              filtered.length,
              "продукт",
              "продукта",
              "продуктов",
            )}`
          : "Ничего не найдено"}
      </p>

      {/* Results */}
      <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {filtered.map((food) => (
          <FoodCard key={food.id} food={food} onClick={() => setDetailsFood(food)} />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-3 flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground">
            <SearchX className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[15px] font-medium text-foreground">
            Ничего не найдено
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Попробуйте изменить запрос или создайте свой продукт
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => setQuery("")}>
              Очистить поиск
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Создать продукт
            </Button>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Значения носят справочный характер
      </p>

      {/* Details, add-food and create-product flows */}
      <FoodDetailsModal
        food={detailsFood}
        onClose={() => setDetailsFood(null)}
        onAddToDiary={handleAddToDiary}
      />
      <AddFoodModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddFoodId(null);
        }}
        onReopen={() => setAddOpen(true)}
        preselectedFoodId={addFoodId}
      />
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Создать продукт"
      >
        <CustomFoodForm
          onCreated={(food) => {
            setCreateOpen(false);
            setToast(`Продукт «${food.name}» создан`);
            window.setTimeout(() => setToast(null), 2500);
          }}
        />
      </Modal>
      <Toast message={toast} />
    </div>
  );
}
