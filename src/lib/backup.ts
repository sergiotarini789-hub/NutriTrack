/**
 * Stage 15A — user data backup (export / import).
 *
 * A backup is a single versioned JSON document holding the persisted
 * NutriTrack state. Export reads the current storage WITHOUT mutating
 * anything; import follows the strict rule VALIDATE FIRST, APPLY
 * SECOND: the whole document is parsed and validated in memory through
 * the very same parsers the app uses for its own storage (single
 * source of truth), and only a fully valid backup is written back —
 * each present section REPLACES its dataset wholesale (no merging,
 * no per-item writes, no partial import on failure).
 */
import { todayKey } from "./dates";
import {
  parseStoredEntries,
  parseStoredOffProducts,
  parseStoredProfile,
  parseStoredTargets,
  parseStoredUserFoods,
  loadEntries,
  loadOffProducts,
  loadProfile,
  loadTargetMode,
  loadTargets,
  loadUserFoods,
  saveEntries,
  saveOffProducts,
  saveProfile,
  saveTargetMode,
  saveTargets,
  saveUserFoods,
} from "./storage";
import type {
  BrandedProduct,
  FoodEntry,
  NutritionTargets,
  TargetMode,
  UserProduct,
  UserProfile,
} from "./types";

/** Backup envelope discriminator and format version (v1). */
export const BACKUP_APP = "nutritrack";
export const BACKUP_VERSION = 1;

/** The full document written by export. */
export interface NutriTrackBackup {
  app: typeof BACKUP_APP;
  version: number;
  /** ISO timestamp of the export moment. */
  exportedAt: string;
  data: {
    entries: FoodEntry[];
    profile: UserProfile;
    targets: NutritionTargets;
    targetMode: TargetMode;
    userFoods: UserProduct[];
    offProducts: BrandedProduct[];
  };
}

/**
 * A validated backup ready to apply. Every field is optional: a
 * section absent from the backup is left untouched on import
 * (explicit partial-backup semantics — present sections replace their
 * dataset, absent ones keep the current data).
 */
export interface ValidatedBackup {
  entries?: FoodEntry[];
  profile?: UserProfile;
  targets?: NutritionTargets;
  targetMode?: TargetMode;
  userFoods?: UserProduct[];
  offProducts?: BrandedProduct[];
}

export type ImportResult =
  | { ok: true; backup: ValidatedBackup }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/** Builds a backup document from the CURRENT persisted state (read-only). */
export function buildBackup(): NutriTrackBackup {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      entries: loadEntries(),
      profile: loadProfile(),
      targets: loadTargets(),
      targetMode: loadTargetMode(),
      userFoods: loadUserFoods(),
      offProducts: loadOffProducts(),
    },
  };
}

/** Download file name: nutritrack-backup-YYYY-MM-DD.json. */
export function backupFileName(): string {
  return `nutritrack-backup-${todayKey()}.json`;
}

/**
 * Validates a PARSED backup document. Strictness rules:
 *   - envelope: must be a NutriTrack backup of a supported version;
 *   - arrays (entries / userFoods / offProducts): every single item
 *     must pass the app's own storage validators — one bad item
 *     rejects the whole import (nothing is silently dropped);
 *   - profile: must be an object, fields are sanitized by the app's
 *     own profile parser;
 *   - targets: must be an object with four positive numbers;
 *   - targetMode: must be exactly "auto" or "manual".
 * Unknown extra keys are ignored (forward compatibility).
 */
export function parseBackup(raw: unknown): ImportResult {
  if (!isRecord(raw) || raw.app !== BACKUP_APP || !isRecord(raw.data)) {
    return { ok: false, error: "Файл не является резервной копией NutriTrack." };
  }
  if (raw.version !== BACKUP_VERSION) {
    return {
      ok: false,
      error: `Неподдерживаемая версия резервной копии: ${String(
        raw.version,
      )} (ожидается ${BACKUP_VERSION}).`,
    };
  }

  const data = raw.data;
  const backup: ValidatedBackup = {};

  if (data.entries !== undefined) {
    if (!Array.isArray(data.entries)) {
      return { ok: false, error: "Раздел «entries» повреждён: ожидается список записей." };
    }
    const parsed = parseStoredEntries(data.entries);
    if (parsed.length !== data.entries.length) {
      return {
        ok: false,
        error: "Раздел «entries» повреждён: найдены некорректные записи дневника.",
      };
    }
    backup.entries = parsed;
  }

  if (data.userFoods !== undefined) {
    if (!Array.isArray(data.userFoods)) {
      return { ok: false, error: "Раздел «user-foods» повреждён: ожидается список продуктов." };
    }
    const parsed = parseStoredUserFoods(data.userFoods);
    if (parsed.length !== data.userFoods.length) {
      return {
        ok: false,
        error: "Раздел «user-foods» повреждён: найдены некорректные продукты.",
      };
    }
    backup.userFoods = parsed;
  }

  if (data.offProducts !== undefined) {
    if (!Array.isArray(data.offProducts)) {
      return { ok: false, error: "Раздел «off-products» повреждён: ожидается список продуктов." };
    }
    const parsed = parseStoredOffProducts(data.offProducts);
    if (parsed.length !== data.offProducts.length) {
      return {
        ok: false,
        error: "Раздел «off-products» повреждён: найдены некорректные продукты Open Food Facts.",
      };
    }
    backup.offProducts = parsed;
  }

  if (data.profile !== undefined) {
    if (!isRecord(data.profile)) {
      return { ok: false, error: "Раздел «profile» повреждён." };
    }
    backup.profile = parseStoredProfile(data.profile);
  }

  if (data.targets !== undefined) {
    const rawTargets: unknown = data.targets;
    if (
      !isRecord(rawTargets) ||
      !(["calories", "protein", "fat", "carbs"] as const).every((field) =>
        isPositiveNumber(rawTargets[field]),
      )
    ) {
      return {
        ok: false,
        error:
          "Раздел «targets» повреждён: ожидаются четыре положительных числа (калории, белки, жиры, углеводы).",
      };
    }
    backup.targets = parseStoredTargets(rawTargets);
  }

  if (data.targetMode !== undefined) {
    if (data.targetMode !== "auto" && data.targetMode !== "manual") {
      return { ok: false, error: "Раздел «target-mode» повреждён: ожидается «auto» или «manual»." };
    }
    backup.targetMode = data.targetMode;
  }

  if (Object.keys(backup).length === 0) {
    return { ok: false, error: "Резервная копия не содержит данных." };
  }
  return { ok: true, backup };
}

/**
 * Parses backup FILE TEXT: corrupted JSON is rejected before any
 * validation; a valid document goes through parseBackup. Never writes.
 */
export function parseBackupText(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Не удалось прочитать файл: повреждённый JSON." };
  }
  return parseBackup(parsed);
}

/**
 * Applies a VALIDATED backup: each present section replaces its
 * persisted dataset wholesale (no merging, ids/createdAt/dates are
 * preserved exactly). Called only after full validation succeeded.
 */
export function applyBackup(backup: ValidatedBackup): void {
  if (backup.entries !== undefined) saveEntries(backup.entries);
  if (backup.userFoods !== undefined) saveUserFoods(backup.userFoods);
  if (backup.offProducts !== undefined) saveOffProducts(backup.offProducts);
  if (backup.profile !== undefined) saveProfile(backup.profile);
  if (backup.targets !== undefined) saveTargets(backup.targets);
  if (backup.targetMode !== undefined) saveTargetMode(backup.targetMode);
}

/**
 * The one entry point the UI uses for import: validate the complete
 * text first, apply only when everything passed. On any validation
 * failure the persisted data is never touched.
 */
export function importBackupText(text: string): ImportResult {
  const result = parseBackupText(text);
  if (!result.ok) return result;
  applyBackup(result.backup);
  return result;
}
