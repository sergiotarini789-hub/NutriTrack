#!/usr/bin/env node
/**
 * Stage 7A — FatSecret barcode coverage probe.
 *
 * ISOLATED VALIDATION SCRIPT — not part of the NutriTrack application.
 *
 * Credentials are read ONLY from environment variables (never hardcoded):
 *   FATSECRET_CLIENT_ID
 *   FATSECRET_CLIENT_SECRET
 *
 * Documented flow (platform.fatsecret.com):
 *   1. OAuth 2.0 client credentials:
 *        POST https://oauth.fatsecret.com/connect/token
 *        grant_type=client_credentials, scope="basic barcode localization"
 *   2. Barcode lookup (region RU, language ru):
 *        GET https://platform.fatsecret.com/rest/food/barcode/find-by-id/v1
 *            ?barcode={gtin13}&region=RU&language=ru&format=json
 *      then GET /rest/food/v4/get?food_id=... for full nutrition.
 *      NOTE: the barcode endpoint is documented as PREMIER-exclusive; a
 *      standard key may return 403 — that outcome must be reported as-is.
 *
 * If credentials are unavailable the script reports NOT TESTED and exits
 * without fabricating any results.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));

const clientId = process.env.FATSECRET_CLIENT_ID;
const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

function writeStatus(payload) {
  mkdirSync(join(ROOT, "results"), { recursive: true });
  writeFileSync(join(ROOT, "results", "fatsecret-status.json"), JSON.stringify(payload, null, 2));
}

if (!clientId || !clientSecret) {
  const payload = {
    tested: false,
    classification: "NOT_TESTED",
    reason:
      "FATSECRET_CLIENT_ID / FATSECRET_CLIENT_SECRET are not set in the environment.",
    checkedEnvVars: ["FATSECRET_CLIENT_ID", "FATSECRET_CLIENT_SECRET"],
    checkedAt: new Date().toISOString(),
    note: "No credentials were invented and no fake responses were generated. FatSecret results must be reported as NOT_TESTED.",
  };
  writeStatus(payload);
  console.log("FatSecret could not be tested because API credentials are unavailable.");
  console.log("Expected environment variables: FATSECRET_CLIENT_ID, FATSECRET_CLIENT_SECRET");
  process.exit(0);
}

// --- Flow below only runs when credentials ARE available ---------------------
const TOKEN_URL = "https://oauth.fatsecret.com/connect/token";
const BARCODE_URL = "https://platform.fatsecret.com/rest/food/barcode/find-by-id/v1";
const FOOD_URL = "https://platform.fatsecret.com/rest/food/v4/get";
const DELAY_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

import { readFileSync } from "node:fs";

async function getToken() {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "basic barcode localization",
    }),
  });
  if (!res.ok) throw new Error(`token: HTTP ${res.status}`);
  const json = await res.json();
  return json.access_token;
}

async function apiGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep raw */ }
  return { httpStatus: res.status, json, raw: text.slice(0, 2000) };
}

const dataset = JSON.parse(readFileSync(join(ROOT, "dataset.json"), "utf8"));
const token = await getToken();
const results = [];
for (const p of dataset.products) {
  const bar = await apiGet(
    `${BARCODE_URL}?barcode=${p.barcode}&region=RU&language=ru&format=json`,
    token,
  );
  let food = null;
  const foodId = bar.json?.food_id?.value ?? bar.json?.food_id ?? null;
  if (foodId) {
    food = await apiGet(
      `${FOOD_URL}?food_id=${foodId}&region=RU&language=ru&format=json`,
      token,
    );
    await sleep(DELAY_MS);
  }
  results.push({ id: p.id, barcode: p.barcode, barcodeLookup: bar, foodDetail: food });
  console.log(`${p.barcode}  HTTP ${bar.httpStatus}  ${bar.json?.error?.message ?? (foodId ? "found" : "no food_id")}`);
}
writeStatus({
  tested: true,
  region: "RU",
  language: "ru",
  checkedAt: new Date().toISOString(),
  results,
});
console.log("\nWrote results/fatsecret-status.json.");
