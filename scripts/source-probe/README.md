# Stage 7A — Real food database source probe

**ISOLATED VALIDATION PACKAGE — NOT part of the NutriTrack application.**

Nothing in this directory is imported by the app. It adds no production
dependencies, changes no models, no UI, no localStorage, and no repository code.
Its only purpose is to measure how well Open Food Facts (and FatSecret, where
credentials exist) cover real packaged products sold in the Russian market,
before Stage 7 is designed.

## Contents

| File | Purpose |
|---|---|
| `dataset.json` | 20 verified Russian-market packaged SKUs: name, brand, EAN-13, package size, verification source (URL + tier), reference nutrition where available |
| `off-probe.mjs` | Queries the official Open Food Facts API **v2** product endpoint, one GET per barcode (1.5 s delay, no parallelism, no retries). Writes `results/off-results.json` |
| `fatsecret-probe.mjs` | FatSecret Platform API probe (OAuth 2.0 client credentials → `food/barcode/find-by-id/v1`, `region=RU`, `language=ru`). Credentials are read **only** from `FATSECRET_CLIENT_ID` / `FATSECRET_CLIENT_SECRET`. Without them it reports NOT_TESTED and fabricates nothing |
| `results/` | Captured probe outputs (raw API responses) |
| `REPORT.md` | Final data report (written after the probe) |

## Dataset methodology

- Products: everyday packaged SKUs from Russian supermarkets, biased toward
  Russian brands (Простоквашино, Домик в деревне, ЭкоНива, Мираторг, Агуша,
  Чудо, Активиа/Danone, Макфа, Добрый, Увелка, Алёнка) plus international
  brands sold in Russia (Heinz — RU-made and imported, Bonduelle RU-made,
  Barilla, Lay's RU-made, Coca-Cola import, Pepsi RU-made).
- Every barcode was verified from a public source **independent of Open Food
  Facts** (Russian retailer product pages, the Роскачество registry, or — only
  once, as the weakest tier — a barcode catalog). ru.openfoodfacts.org pages
  were never used to build the dataset, so coverage numbers are not circular.
- Every barcode passed EAN-13 check-digit validation (`off-probe.mjs` refuses
  to run otherwise).
- SKUs that could not be fully verified were excluded (see `meta.excluded` in
  `dataset.json`), e.g. «ВкусВилл» творог 5% — barcode known via rskrf.ru but
  package size unverifiable.

## Running

```bash
node off-probe.mjs            # requires network access to world.openfoodfacts.org
node fatsecret-probe.mjs      # requires FATSECRET_CLIENT_ID / FATSECRET_CLIENT_SECRET
```

Both scripts use only Node built-ins (Node ≥ 18). No dependencies are added to
the application.

## Execution environment note

This probe was executed from a sandboxed environment whose direct egress is
restricted to an allowlist (GitHub/npm). The Open Food Facts requests were
therefore issued through the platform's fetch infrastructure (same official
API URLs, one request per barcode, sequential batches). The responses captured
in `results/off-results.json` are the verbatim API replies. The scripts in this
directory remain runnable as-is from any normal networked environment.
