"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Barcode, Loader2, Plus, RotateCcw, ScanBarcode, SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDiary } from "@/lib/diary";
import { normalizeBarcode } from "@/lib/barcode";
import type { FoodProduct } from "@/lib/types";

// Stage 8A spike: the scanner overlay is client-only and lazily loaded,
// so camera APIs (and the ZXing fallback chunk) never run during server
// rendering and stay out of the initial bundle.
const BarcodeScannerModal = dynamic(
  () => import("./BarcodeScannerModal"),
  { ssr: false },
);

/**
 * The scan button is shown only on touch-primary devices (phones,
 * tablets) — decided after mount to avoid hydration mismatches. Desktop
 * keeps the unchanged manual-input flow and is never asked for camera
 * permission.
 */
function isScannerEntryVisible(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(pointer: coarse)").matches;
}

interface BarcodeLookupProps {
  /** A usable product was resolved — continue to the quantity step. */
  onFound: (food: FoodProduct) => void;
  /** Open the manual creation flow (prefilled with what we know). */
  onManualCreate: (prefill: { barcode: string; name?: string; brand?: string }) => void;
}

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "not_found"; barcode: string }
  | { kind: "incomplete"; barcode: string; name?: string; brand?: string }
  | { kind: "error"; barcode: string };

/**
 * Barcode input for the add-food flow (Stage 7). Looks the code up
 * locally first (user products win), then in Open Food Facts via the
 * server proxy. All states are real: the spinner is shown exactly
 * while the request is in flight; "not found" and "error" are distinct
 * outcomes. Entirely in Russian.
 */
export function BarcodeLookup({ onFound, onManualCreate }: BarcodeLookupProps) {
  const { lookupBarcode } = useDiary();
  const [value, setValue] = useState("");
  const [state, setState] = useState<LookupState>({ kind: "idle" });
  const [invalid, setInvalid] = useState(false);
  const [canScan, setCanScan] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The scan button appears only on touch-primary devices, decided after
  // mount (no hydration mismatch; desktop is never asked for the camera).
  useEffect(() => {
    setCanScan(isScannerEntryVisible());
  }, []);

  async function runLookup(raw: string) {
    const normalized = normalizeBarcode(raw);
    if (!normalized) {
      setInvalid(true);
      setState({ kind: "idle" });
      return;
    }
    setInvalid(false);
    setState({ kind: "loading" });
    const result = await lookupBarcode(normalized);
    if (result.status === "found") {
      setState({ kind: "idle" });
      onFound(result.product);
      return;
    }
    if (result.status === "not_found") {
      setState({ kind: "not_found", barcode: normalized });
    } else if (result.status === "incomplete") {
      setState({
        kind: "incomplete",
        barcode: normalized,
        name: result.name,
        brand: result.brand,
      });
    } else {
      // Technical failure — the product may exist; never claim otherwise.
      setState({ kind: "error", barcode: normalized });
    }
  }

  const busy = state.kind === "loading";

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Barcode className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setInvalid(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && value.trim() && !busy) {
                runLookup(value);
              }
            }}
            placeholder="Поиск по штрихкоду"
            aria-label="Штрихкод"
            aria-invalid={invalid}
            className="h-12 w-full rounded-2xl border border-transparent bg-foreground/[0.05] pl-11 pr-4 text-base text-foreground outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-card focus:ring-4 focus:ring-primary/10 aria-[invalid=true]:border-red-500/60"
          />
        </div>
        <Button
          size="lg"
          className="rounded-2xl px-5"
          disabled={!value.trim() || busy}
          onClick={() => runLookup(value)}
        >
          {busy ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            "Найти"
          )}
        </Button>
      </div>

      {canScan && (
        <Button
          variant="soft"
          size="lg"
          className="mt-2 w-full rounded-2xl"
          onClick={() => setScannerOpen(true)}
        >
          <ScanBarcode className="h-[18px] w-[18px]" aria-hidden />
          Сканировать штрихкод
        </Button>
      )}

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onUse={(barcode) => {
          // The detected code goes through the SAME lookup path as
          // manual entry — no second OFF implementation exists.
          setScannerOpen(false);
          setValue(barcode);
          void runLookup(barcode);
        }}
      />

      {invalid && (
        <p
          className="mt-2 text-[13px] font-medium text-red-600 dark:text-red-400"
          role="alert"
        >
          Штрихкод должен состоять из цифр
        </p>
      )}

      {state.kind === "loading" && (
        <p className="mt-3 flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Ищем товар…
        </p>
      )}

      {state.kind === "not_found" && (
        <div
          className="mt-3 rounded-3xl border border-dashed border-border px-5 py-6 text-center"
          role="status"
        >
          <SearchX
            className="mx-auto h-8 w-8 text-muted-foreground/70"
            aria-hidden
          />
          <p className="mt-2.5 text-[15px] font-medium text-foreground">
            Товар не найден
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Мы не нашли этот штрихкод в Open Food Facts.
          </p>
          <Button
            variant="soft"
            className="mt-4"
            onClick={() =>
              onManualCreate({ barcode: state.barcode })
            }
          >
            <Plus className="h-4 w-4" />
            Добавить вручную
          </Button>
        </div>
      )}

      {state.kind === "incomplete" && (
        <div
          className="mt-3 rounded-3xl border border-dashed border-border px-5 py-6 text-center"
          role="status"
        >
          <Barcode
            className="mx-auto h-8 w-8 text-muted-foreground/70"
            aria-hidden
          />
          <p className="mt-2.5 text-[15px] font-medium text-foreground">
            {state.name ?? "Товар найден"}
            {state.brand ? ` · ${state.brand}` : ""}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Товар есть в Open Food Facts, но без данных о пищевой
            ценности.
          </p>
          <Button
            variant="soft"
            className="mt-4"
            onClick={() =>
              onManualCreate({
                barcode: state.barcode,
                name: state.name,
                brand: state.brand,
              })
            }
          >
            <Plus className="h-4 w-4" />
            Добавить вручную
          </Button>
        </div>
      )}

      {state.kind === "error" && (
        <div
          className="mt-3 rounded-3xl border border-dashed border-border px-5 py-6 text-center"
          role="alert"
        >
          <RotateCcw
            className="mx-auto h-8 w-8 text-muted-foreground/70"
            aria-hidden
          />
          <p className="mt-2.5 text-[15px] font-medium text-foreground">
            Не удалось получить данные
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Проверьте соединение и попробуйте ещё раз.
          </p>
          <Button
            variant="soft"
            className="mt-4"
            onClick={() => runLookup(state.barcode)}
          >
            <RotateCcw className="h-4 w-4" />
            Повторить
          </Button>
        </div>
      )}
    </div>
  );
}
