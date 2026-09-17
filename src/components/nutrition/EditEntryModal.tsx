"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDiary } from "@/lib/diary";
import { formatNumber } from "@/lib/format";
import { parseAmountInput, type ResolvedEntry } from "@/lib/nutrition";
import { FoodQuantity } from "./FoodQuantity";

interface EditEntryModalProps {
  /** The entry to edit; null closes the modal. */
  item: ResolvedEntry | null;
  onClose: () => void;
}

/** Edits the amount/unit of an existing diary entry in place. */
export function EditEntryModal({ item, onClose }: EditEntryModalProps) {
  const { updateEntry } = useDiary();
  const [amount, setAmount] = useState("");
  const [unitKey, setUnitKey] = useState("g");

  useEffect(() => {
    if (item) {
      setAmount(formatNumber(item.entry.amount));
      setUnitKey(item.entry.unit);
    }
  }, [item]);

  if (!item) return null;

  const currentItem = item;
  const parsed = parseAmountInput(amount);
  const valid = parsed !== null && parsed > 0;

  function handleSave() {
    if (!valid || parsed === null) return;
    updateEntry(currentItem.entry.id, { amount: parsed, unit: unitKey });
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Изменить запись"
      footer={
        <Button size="lg" className="w-full" disabled={!valid} onClick={handleSave}>
          Сохранить
        </Button>
      }
    >
      <FoodQuantity
        food={item.food}
        amount={amount}
        unitKey={unitKey}
        onAmountChange={setAmount}
        onUnitChange={setUnitKey}
        onSubmit={handleSave}
      />
    </Modal>
  );
}
