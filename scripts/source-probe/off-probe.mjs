#!/usr/bin/env node
/**
 * Stage 7A — Open Food Facts barcode coverage probe.
 *
 * ISOLATED VALIDATION SCRIPT — not part of the NutriTrack application.
 * Reads dataset.json (verified Russian-market SKUs) and queries the official
 * Open Food Facts API v2 product endpoint, one request per barcode:
 *
 *   GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json?fields=...
 *
 * API version note: v2 is the current stable, documented API. (v3 exists but is
 * marked "Work in Progress" in the official docs.) v2 was verified live before
 * this probe: an existing barcode returns {"status":1,"product":{...}} and a
 * missing barcode returns HTTP 404 with {"status":0,"status_verbose":"product not found"}.
 *
 * Usage:       node off-probe.mjs
 * Output:      results/off-results.json
 * Rate limits: one request per barcode, 1.5 s delay between requests,
 *              no retries, no parallelism. ~20 requests total.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const API = "https://world.openfoodfacts.org/api/v2/product";
const USER_AGENT =
  "NutriTrackStage7AProbe/1.0 (one-off data source validation; https://github.com/sergiotarini789-hub/NutriTrack)";
const DELAY_MS = 1500;

const FIELDS = [
  "code",
  "product_name",
  "product_name_ru",
  "generic_name",
  "brands",
  "brand_owner",
  "quantity",
  "product_quantity",
  "serving_size",
  "serving_quantity",
  "nutrition_data",
  "nutrition_data_per",
  "nutriments",
  "image_front_url",
  "image_small_url",
  "countries",
  "complete",
  "owner",
  "unique_scans_n",
  "created_t",
  "last_modified_t",
].join(",");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** EAN-13 check-digit validation (sanity gate, not a substitute for verification). */
function ean13Valid(code) {
  if (!/^\d{13}$/.test(code)) return false;
  const digits = code.split("").map(Number);
  const sum = digits
    .slice(0, 12)
    .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === digits[12];
}

async function lookup(barcode) {
  const url = `${API}/${barcode}.json?fields=${FIELDS}`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return {
      barcode,
      httpStatus: res.status,
      transportError: null,
      apiStatus: body?.status ?? null,
      apiStatusVerbose: body?.status_verbose ?? null,
      product: body?.product ?? null,
      ms: Date.now() - started,
    };
  } catch (err) {
    return {
      barcode,
      httpStatus: null,
      transportError: String(err),
      apiStatus: null,
      apiStatusVerbose: null,
      product: null,
      ms: Date.now() - started,
    };
  }
}

const dataset = JSON.parse(readFileSync(join(ROOT, "dataset.json"), "utf8"));

// Pre-flight: refuse to run on invalid barcodes.
const invalid = dataset.products.filter((p) => !ean13Valid(p.barcode));
if (invalid.length > 0) {
  console.error("ABORT: invalid EAN-13 check digits:", invalid.map((p) => `${p.id}:${p.barcode}`).join(", "));
  process.exit(1);
}

const results = [];
for (const p of dataset.products) {
  const r = await lookup(p.barcode);
  results.push({
    id: p.id,
    expected: { name: p.name, brand: p.brand, barcode: p.barcode },
    ...r,
  });
  const found = r.apiStatus === 1;
  console.log(
    `${p.barcode}  HTTP ${r.httpStatus ?? "ERR"}  status=${r.apiStatus ?? "?"}  ` +
      `${found ? (r.product?.product_name ?? "(no name)") : r.apiStatusVerbose ?? r.transportError}`,
  );
  await sleep(DELAY_MS);
}

mkdirSync(join(ROOT, "results"), { recursive: true });
writeFileSync(
  join(ROOT, "results", "off-results.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      api: `${API}/{barcode}.json`,
      userAgent: USER_AGENT,
      requests: results.length,
      note: "One GET per barcode, sequential with 1.5s delay.",
      results,
    },
    null,
    2,
  ),
);
console.log(`\nWrote results/off-results.json (${results.length} products).`);
