#!/usr/bin/env node
/**
 * Stage 7A — analysis of the captured Open Food Facts results.
 * ISOLATED VALIDATION SCRIPT — not part of the NutriTrack application.
 *
 * Reads dataset.json + results/off-results.json, applies the documented
 * classification rubric below, computes metrics, writes results/analysis.json.
 *
 * Classification rubric (applied manually per product, recorded in CLASSIFICATION):
 * - FOUND_CORRECT: returned record's brand AND product identity (type/flavor/fat%)
 *   match the verified SKU. Package-size-only discrepancies or missing metadata
 *   do NOT demote the result — per-100g nutrition stays valid for the same recipe —
 *   but they are recorded as notes.
 * - FOUND_POSSIBLE_MISMATCH: brand/product family matches, but the record represents
 *   a variant whose NUTRITION may differ (e.g. regional recipe) or identity fields
 *   materially conflict.
 * - FOUND_WRONG_PRODUCT: clearly a different product.
 * - NOT_FOUND: API status 0.
 * - ERROR: technical failure.
 *
 * Nutrition-accuracy bands (explained in REPORT.md):
 * - exact: |Δ| <= max(2% relative, 0.1 g / 2 kcal)
 * - small: |Δ| <= max(10% relative, 1 g) on every value
 * - significant: any value beyond the "small" band
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(readFileSync(join(ROOT, "dataset.json"), "utf8"));
const off = JSON.parse(readFileSync(join(ROOT, "results", "off-results.json"), "utf8"));

const CLASSIFICATION = {
  "prostokvashino-milk-25": ["FOUND_CORRECT", "Точное совпадение SKU (имя + 930 ml). kcal отсутствует — только кДж.", "serving = вся упаковка (930 мл)"],
  "prostokvashino-yogurt-strawberry": ["NOT_FOUND", "—", "—"],
  "domik-v-derevne-milk-25": ["FOUND_CORRECT", "Бренд и продукт совпадают; в OFF размер 925 мл (старая упаковка), проверенный SKU — 950 г.", "пер-100мл БЖУ соответствует этикетке 2,5% молока"],
  "ekoniva-milk-25": ["FOUND_CORRECT", "Бренд «Эконива Econiva», «Молоко 2,5%»; размер упаковки в OFF не заполнен.", "serving «1 portion (100 g)»"],
  "ekoniva-milk-32": ["FOUND_CORRECT", "Бренд «Эконива», «Молоко 3.2%»; размер упаковки не заполнен.", "—"],
  "activia-yogurt-len-chernika": ["NOT_FOUND", "—", "в OFF есть другие SKU «Активиа», но не этот штрихкод"],
  "chudo-yogurt-peach-apricot": ["NOT_FOUND", "—", "в OFF есть другие SKU «Чудо», но не этот штрихкод"],
  "agusha-curd-classic": ["FOUND_CORRECT", "Точное совпадение SKU: «Творог детский «Агуша» классический 4,5%», 50 g.", "БЖУ соответствуют этикетке"],
  "miratorg-nuggets": ["FOUND_CORRECT", "Бренд и название совпадают; в OFF quantity «100 g» (у SKU 300 г) и countries «Japan» (ошибочные данные).", "serving 300 г = упаковке"],
  "heinz-ketchup-550": ["FOUND_CORRECT", "Бренд Heinz; имя и размер в записи отсутствуют; идентификация по бренду + БЖУ (110/1,5/0,1/26) + верифицированному штрихкоду.", "страны «Belarus, Russia» — согласуется с источниками верификации"],
  "heinz-ketchup-460": ["FOUND_CORRECT", "«Томатный кетчуп», Heinz; размер в записи отсутствует.", "—"],
  "makfa-egg-spaghetti": ["FOUND_CORRECT", "Точное совпадение SKU: «Яичные спагетти», Makfa, quantity «450».", "изображение отсутствует"],
  "bonduelle-corn": ["FOUND_POSSIBLE_MISMATCH", "Вернулась венгерская версия: имя «csemegekukorica», 285 г (RU SKU — 340 г), kcal 78,6/100 г против 58 на RU-этикетке; владелец записи org-bonduelle-europe-long-life.", "региональный вариант рецепта под тем же EAN"],
  "lays-chips-salt": ["NOT_FOUND", "—", "в OFF есть другие RU SKU Lay's, но не этот штрихкод"],
  "cocacola-classic-900": ["FOUND_CORRECT", "«Coca-Cola Original Taste»; в записи 1 L — RU-импортная бутылка 900 мл того же напитка (HBC использует этот EAN для семейства 0,9/1 л).", "1188 сканирований; БЖУ = RU-этикетке"],
  "pepsi-2l": ["NOT_FOUND", "—", "—"],
  "dobry-orange-nectar-2l": ["FOUND_CORRECT", "Совпадение SKU: «Нектар Добрый апельсиновый, 2л» (в имени опечатка «Апельсининовый»).", "serving 250 мл"],
  "barilla-spaghetti-5": ["FOUND_CORRECT", "Точное совпадение SKU: «Spaghetti», Barilla, 450 gr.", "фото — русская этикетка (front_ru)"],
  "alyonka-chocolate": ["FOUND_CORRECT", "Совпадение SKU: «Порционный молочный шоколад», «Алёнка», 100 г.", "пищевая ценность полностью отсутствует"],
  "uvelka-buckwheat": ["FOUND_CORRECT", "Совпадение SKU: «Buckwheat»/«Крупа гречневая ядрица «Экстра»», Увелка, 800 г.", "имя на английском; углеводы расходятся с ритейлер-справочником (61 против 72)"],
};

function nutritionGrade(product) {
  const n = product?.nutriments;
  if (!n) return { grade: "NO", detail: "nutriments отсутствуют" };
  const kcal = n["energy-kcal_100g"];
  const p = n["proteins_100g"], f = n["fat_100g"], c = n["carbohydrates_100g"];
  const haveKcal = typeof kcal === "number";
  const haveMacros = [p, f, c].every((v) => typeof v === "number");
  const kj = n["energy-kj_100g"] ?? n["energy_100g"];
  if (haveKcal && haveMacros) return { grade: "YES", kcal, p, f, c, detail: `${kcal} ккал / ${p}/${f}/${c}` };
  if (haveMacros && !haveKcal)
    return { grade: "PARTIAL", p, f, c, detail: `БЖУ ${p}/${f}/${c}; kcal нет (только ${kj} кДж ≈ ${(kj / 4.184).toFixed(0)} ккал)` };
  return { grade: "PARTIAL", detail: "часть значений отсутствует" };
}

function diffBand(ref, val) {
  if (ref == null || val == null) return "unavailable";
  const abs = Math.abs(ref - val);
  const rel = abs / Math.max(ref, 0.001);
  if (abs <= 0.1 || rel <= 0.02) return "exact";
  if (abs <= 1.0 || rel <= 0.10) return "small";
  return "significant";
}

const rows = [];
for (const p of dataset.products) {
  const r = off.results.find((x) => x.id === p.id);
  const [classification, identity, note] = CLASSIFICATION[p.id];
  const found = r.apiStatus === 1;
  const product = r.response?.product;
  const nutrition = found ? nutritionGrade(product) : { grade: "N/A" };
  const image = found ? (product?.image_front_url ? "YES" : "NO") : "N/A";
  const serving = found ? (product?.serving_size ?? "—") : "N/A";
  const qty = found ? (product?.quantity ?? "—") : "N/A";
  const ruPrefix = p.barcode.startsWith("46");
  let nutritionComparison = null;
  if (found && p.referenceNutrition && nutrition.grade === "YES") {
    const ref = p.referenceNutrition;
    nutritionComparison = {
      ref: `${ref.kcal} ккал / ${ref.protein}/${ref.fat}/${ref.carbs} (${ref.source})`,
      off: `${nutrition.kcal} ккал / ${nutrition.p}/${nutrition.f}/${nutrition.c}`,
      bands: {
        kcal: diffBand(ref.kcal, nutrition.kcal),
        protein: diffBand(ref.protein, nutrition.p),
        fat: diffBand(ref.fat, nutrition.f),
        carbs: diffBand(ref.carbs, nutrition.c),
      },
    };
  }
  rows.push({
    id: p.id, name: p.name, brand: p.brand, barcode: p.barcode,
    size: `${p.packageSize} ${p.packageUnit}`, ruPrefix,
    classification, identity, note,
    nutrition: nutrition.grade, nutritionDetail: nutrition.detail ?? "",
    image, serving, offQuantity: qty,
    nutritionComparison,
  });
}

const count = (cls) => rows.filter((r) => r.classification === cls).length;
const foundRows = rows.filter((r) => r.classification.startsWith("FOUND"));
const ruRows = rows.filter((r) => r.ruPrefix);
const metrics = {
  total: rows.length,
  off: {
    found: foundRows.length,
    foundCorrect: count("FOUND_CORRECT"),
    foundPossibleMismatch: count("FOUND_POSSIBLE_MISMATCH"),
    foundWrongProduct: count("FOUND_WRONG_PRODUCT"),
    notFound: count("NOT_FOUND"),
    errors: count("ERROR"),
    coverageCorrect: `${count("FOUND_CORRECT")}/${rows.length} = ${(count("FOUND_CORRECT") / rows.length * 100).toFixed(1)}%`,
    barcodeSuccessRate: `${foundRows.length}/${rows.length} = ${(foundRows.length / rows.length * 100).toFixed(1)}%`,
    identityAccuracyAmongFound: `${count("FOUND_CORRECT")}/${foundRows.length} = ${(count("FOUND_CORRECT") / foundRows.length * 100).toFixed(1)}%`,
  },
  offRuPrefixEans: {
    total: ruRows.length,
    found: ruRows.filter((r) => r.classification.startsWith("FOUND")).length,
    correct: ruRows.filter((r) => r.classification === "FOUND_CORRECT").length,
  },
  offNonRuEans: {
    total: rows.length - ruRows.length,
    found: rows.filter((r) => !r.ruPrefix && r.classification.startsWith("FOUND")).length,
    correct: rows.filter((r) => !r.ruPrefix && r.classification === "FOUND_CORRECT").length,
  },
  nutritionAmongFound: {
    yes: foundRows.filter((r) => r.nutrition === "YES").length,
    partial: foundRows.filter((r) => r.nutrition === "PARTIAL").length,
    no: foundRows.filter((r) => r.nutrition === "NO").length,
  },
  imageAmongFound: {
    yes: foundRows.filter((r) => r.image === "YES").length,
    no: foundRows.filter((r) => r.image === "NO").length,
  },
  fatsecret: { tested: false, reason: "credentials unavailable (FATSECRET_CLIENT_ID / FATSECRET_CLIENT_SECRET not set)" },
};

writeFileSync(join(ROOT, "results", "analysis.json"), JSON.stringify({ metrics, rows }, null, 2));

// Console table
console.log("=".repeat(110));
for (const r of rows) {
  console.log(
    `${r.classification.padEnd(24)}${r.barcode}  nutr=${r.nutrition.padEnd(7)} img=${r.image.padEnd(3)} qty=${String(r.offQuantity).padEnd(8)} ${r.name}`,
  );
}
console.log("=".repeat(110));
console.log(JSON.stringify(metrics, null, 2));
