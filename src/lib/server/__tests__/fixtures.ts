/**
 * Fixtures for Open Food Facts v3 tests.
 *
 * The four marked REAL are verbatim responses of the live
 * world.openfoodfacts.org API v3 (captured 2026-09-18, fields-trimmed
 * request with lc=ru&cc=ru) for products verified in the Stage 7A
 * probe. The rest are synthetic variants exercising missing fields.
 */

/* ------------------------------ REAL ------------------------------ */

/** REAL: complete nutrition, 50 g package, serving = package. */
export const AGUSHA_V3 = {
  code: "4602541000592",
  errors: [],
  product: {
    brands: "Агуша",
    categories_tags: [
      "en:dairies",
      "en:fermented-foods",
      "en:desserts",
      "en:fermented-milk-products",
      "en:cheeses",
      "en:dairy-desserts",
      "en:baby-foods",
      "en:cream-cheeses",
      "en:from-6-months",
      "en:quarks",
      "ru:5 %",
      "ru:Творог 4",
      "ru:Творог детский",
      "ru:Творог детский 4",
    ],
    code: "4602541000592",
    generic_name:
      "Творог детский «Агуша» классический, с массовой долей жира 4,5 %",
    image_front_url:
      "https://images.openfoodfacts.org/images/products/460/254/100/0592/front_ru.3.400.jpg",
    ingredients_text: "молоко нормализованное, закваска",
    nutriments: {
      calcium: 0.1,
      calcium_100g: 0.1,
      carbohydrates: 3.5,
      carbohydrates_100g: 3.5,
      energy: 372,
      "energy-kcal": 89,
      "energy-kcal_100g": 89,
      "energy-kj": 372,
      "energy-kj_100g": 372,
      fat: 4.5,
      fat_100g: 4.5,
      proteins: 8.5,
      proteins_100g: 8.5,
    },
    nutrition_data: "on",
    nutrition_data_per: "100g",
    product_name: "Творог детский «Агуша» классический 4,5 %",
    product_name_ru: "Творог детский «Агуша» классический 4,5 %",
    product_quantity: 50,
    product_quantity_unit: "g",
    quantity: "50 g",
    serving_quantity: 50,
    serving_size: "50 g",
  },
  result: { id: "product_found", lc_name: "Продукт найден", name: "Product found" },
  status: "success",
  warnings: [],
} as const;

/** REAL: kJ only (no kcal), per-100ml basis, serving = whole package. */
export const PROSTOKVASHINO_V3 = {
  code: "4607053473544",
  errors: [],
  product: {
    brands: "Простоквашино",
    categories_tags: [
      "en:dairies",
      "en:milks-liquid-and-powder",
      "en:milks",
      "en:pasteurised-products",
      "en:pasteurised-milks",
      "ru:молоко-питьевое",
      "ru:молоко-питьевое-пастеризованное",
    ],
    code: "4607053473544",
    generic_name: "Молоко питьевое пастеризованное, массовая доля жира 2,5%",
    image_front_url:
      "https://images.openfoodfacts.org/images/products/460/705/347/3544/front_ru.12.400.jpg",
    ingredients_text: "обезжиренное молоко, сливки",
    nutriments: {
      carbohydrates: 4.9,
      carbohydrates_100g: 4.9,
      energy: 225,
      "energy-kj": 225,
      "energy-kj_100g": 225,
      fat: 2.5,
      fat_100g: 2.5,
      proteins: 2.9,
      proteins_100g: 2.9,
    },
    nutrition_data: "on",
    nutrition_data_per: "100ml",
    product_name:
      "Молоко Простоквашино 2,5 % бут. пастеризованное 930мл",
    product_name_ru:
      "Молоко Простоквашино 2,5 % бут. пастеризованное 930мл",
    product_quantity: 930,
    product_quantity_unit: "ml",
    quantity: "930 ml",
    serving_quantity: 930,
    serving_size: "930 ml",
  },
  result: { id: "product_found", lc_name: "Продукт найден", name: "Product found" },
  status: "success",
  warnings: [],
} as const;

/** REAL: complete nutrition, ambiguous categories (beverages + dairies). */
export const DOMIK_V3 = {
  code: "4690228007842",
  errors: [],
  product: {
    brands: "Домик в деревне",
    categories_tags: [
      "en:beverages-and-beverages-preparations",
      "en:beverages",
      "en:dairies",
      "en:dairy-drinks",
      "en:milks-liquid-and-powder",
      "en:milks",
      "en:homogenized-milks",
    ],
    code: "4690228007842",
    image_front_url:
      "https://images.openfoodfacts.org/images/products/469/022/800/7842/front_ru.5.400.jpg",
    nutriments: {
      carbohydrates: 4.7,
      carbohydrates_100g: 4.7,
      energy: 223,
      "energy-kcal": 53,
      "energy-kcal_100g": 53,
      "energy-kj": 223,
      "energy-kj_100g": 223,
      fat: 2.5,
      fat_100g: 2.5,
      proteins: 3,
      proteins_100g: 3,
    },
    nutrition_data: "on",
    nutrition_data_per: "100ml",
    product_name: "Молоко Домик в деревне  2,5%",
    product_name_ru: "Молоко Домик в деревне  2,5%",
    product_quantity: 925,
    product_quantity_unit: "ml",
    quantity: "925мл",
  },
  result: { id: "product_found", lc_name: "Продукт найден", name: "Product found" },
  status: "success",
  warnings: [],
} as const;

/** REAL: complete nutrition, per-100g, 130 g package. Captured 2026-09-18
 * as the Stage 8A scanner QA product (Danissimo kiwi curd dessert). */
export const DANISSIMO_V3 = {
  code: "4600605017265",
  errors: [],
  product: {
    brands: "Даниссимо",
    categories_tags: [
      "en:dairies",
      "en:fermented-foods",
      "en:desserts",
      "en:fermented-milk-products",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
    ],
    code: "4600605017265",
    generic_name: "Продукт творожный с киви, массовая доля жира 5,5 %",
    image_front_url:
      "https://images.openfoodfacts.org/images/products/460/060/501/7265/front_ru.7.400.jpg",
    ingredients_text:
      "Творог обезжиренный, нормализованные сливки, наполнитель (киви; вода; сахар; загуститель - Е1442; семечки киви; регуляторы кислотности - цитраты натрия, лимонная кислота; ароматизатор; загуститель - гуаровая камедь; краситель — медные комплексы хлорофиллинов), сахар. Может содержать следы глютена, соевого лецитина, яйца куриного, орехов.",
    nutriments: {
      carbohydrates: 15.8,
      carbohydrates_100g: 15.8,
      carbohydrates_unit: "g",
      carbohydrates_value: 15.8,
      energy: 567,
      "energy-kcal": 135,
      "energy-kcal_100g": 135,
      "energy-kcal_unit": "kcal",
      "energy-kcal_value": 135,
      "energy-kj": 567,
      "energy-kj_100g": 567,
      "energy-kj_unit": "kJ",
      "energy-kj_value": 567,
      energy_100g: 567,
      energy_unit: "kJ",
      energy_value: 567,
      fat: 5.5,
      fat_100g: 5.5,
      fat_unit: "g",
      fat_value: 5.5,
      "nova-group": 4,
      "nova-group_100g": 4,
      "nova-group_serving": 4,
      "nova-group_unit": "",
      "nova-group_value": 4,
      proteins: 5.5,
      proteins_100g: 5.5,
      proteins_unit: "g",
      proteins_value: 5.5,
      sucrose: 11.5,
      sucrose_100g: 11.5,
      sucrose_unit: "g",
      sucrose_value: 11.5,
    },
    nutrition_data: "on",
    nutrition_data_per: "100g",
    nutrition_data_prepared_per: "100g",
    product_name: "Даниссимо Творожный с сочным киви 130г",
    product_name_ru: "Даниссимо Творожный с сочным киви 130г",
    product_quantity: 130,
    product_quantity_unit: "g",
    quantity: "130 г",
  },
  result: { id: "product_found", lc_name: "Продукт найден", name: "Product found" },
  status: "success",
  warnings: [],
} as const;

/** REAL: v3 not-found response. */
export const NOT_FOUND_V3 = {
  code: "4609999999999",
  errors: [
    {
      field: { id: "code", value: "4609999999999" },
      impact: { id: "failure", lc_name: "Провал", name: "Failure" },
      message: { id: "product_not_found", lc_name: "", name: "" },
    },
  ],
  result: { id: "product_not_found", lc_name: "Продукт не найден", name: "Product not found" },
  status: "failure",
  warnings: [],
} as const;

/* --------------------- REAL: text search (8B) --------------------- */

/**
 * REAL response of the official OFF Search API
 * (GET /cgi/search.pl?search_terms=даниссимо&search_simple=1&action=
 * process&json=1&fields=…&lc=ru&cc=ru, captured 2026-09-18). Note the
 * search envelope differs from the v3 product endpoint: count/page/
 * page_size/products. Products carry the same field names as v3, so
 * the existing normalizer applies. `page` arrives as a STRING.
 */
export const SEARCH_DANISSIMO = {
  count: 42,
  page: "1",
  page_count: 2,
  page_size: 2,
  skip: 0,
  products: [
    {
      brands: "Даниссимо",
      categories_tags: [
        "en:dairies",
        "en:fermented-foods",
        "en:desserts",
        "en:fermented-milk-products",
        "en:dairy-desserts",
        "en:fermented-dairy-desserts",
        "en:yogurts",
        "ru:9 % и хрустящие шарики в шоколаде",
        "ru:Йогурт с массовой долей жира 6",
      ],
      code: "4600605019351",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/501/9351/front_ru.16.400.jpg",
      nutriments: {
        "added-sugars": 0,
        "added-sugars_100g": 0,
        "added-sugars_modifier": "~",
        "added-sugars_unit": "g",
        "added-sugars_value": 0,
        carbohydrates: "11.9",
        carbohydrates_100g: 11.9,
        carbohydrates_unit: "g",
        carbohydrates_value: "11.9",
        energy: 514,
        "energy-kcal": 123,
        "energy-kcal_100g": 123,
        "energy-kcal_unit": "kcal",
        "energy-kcal_value": 123,
        "energy-kj": 514,
        "energy-kj_100g": 514,
        "energy-kj_unit": "kJ",
        "energy-kj_value": 514,
        energy_100g: 514,
        energy_unit: "kJ",
        energy_value: 514,
        fat: "6.9",
        fat_100g: 6.9,
        fat_unit: "g",
        fat_value: "6.9",
        "fruits-vegetables-legumes-estimate-from-ingredients_100g": 0,
        "fruits-vegetables-nuts-estimate-from-ingredients_100g": 0,
        "nova-group": 4,
        "nova-group_100g": 4,
        "nova-group_serving": 4,
        "nova-group_unit": "",
        "nova-group_value": 4,
        proteins: "3.3",
        proteins_100g: 3.3,
        proteins_unit: "g",
        proteins_value: "3.3",
      },
      nutrition_data: "on",
      nutrition_data_per: "100g",
      nutrition_data_prepared_per: "100g",
      product_name: "Йогурт с шариками в шоколаде",
      product_name_ru: "Йогурт с шариками в шоколаде",
      product_quantity: 105,
      product_quantity_unit: "g",
      quantity: "105 г",
      serving_quantity: null,
    },
    {
      brands: "Danone",
      categories_tags: [
        "en:dairies",
        "en:fermented-foods",
        "en:desserts",
        "en:fermented-milk-products",
        "en:dairy-desserts",
        "en:fermented-dairy-desserts",
        "en:yogurts",
        "ru:9 % и драже",
        "ru:9 % и драже Хрустящие шарики с ягодным вкусом",
        "ru:Йогурт «Даниссимо Фантазия» с массовой долей жира 6",
        "ru:Йогурт с массовой долей жира 6",
      ],
      code: "4600605021781",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/502/1781/front_ru.27.400.jpg",
      nutriments: {
        carbohydrates: "11.6",
        carbohydrates_100g: 11.6,
        carbohydrates_unit: "g",
        carbohydrates_value: "11.6",
        energy: 505,
        "energy-kcal": "120.9",
        "energy-kcal_100g": 120.9,
        "energy-kcal_modifier": "~",
        "energy-kcal_unit": "kcal",
        "energy-kcal_value": "120.9",
        "energy-kj": 505,
        "energy-kj_100g": 505,
        "energy-kj_unit": "kJ",
        "energy-kj_value": 505,
        energy_100g: 505,
        energy_unit: "kJ",
        energy_value: 505,
        fat: "6.9",
        fat_100g: 6.9,
        fat_unit: "g",
        fat_value: "6.9",
        proteins: "3.1",
        proteins_100g: 3.1,
        proteins_unit: "g",
        proteins_value: "3.1",
        sucrose: 7,
        sucrose_100g: 7,
        sucrose_unit: "g",
        sucrose_value: 7,
      },
      nutrition_data: "on",
      nutrition_data_per: "100g",
      nutrition_data_prepared_per: "100g",
      product_name:
        "Даниссимо Фантазия Хрустящие шарики с ягодным вкусом 105г",
      product_name_ru:
        "Даниссимо Фантазия Хрустящие шарики с ягодным вкусом 105г",
      product_quantity: 105,
      product_quantity_unit: "g",
      quantity: "105 г (93 г йогурт и 12 г наполнитель)",
    },
  ],
} as const;

/**
 * SYNTHETIC search page exercising the guard rails: a nameless record
 * (skipped), a nutritionless record (kept, unknown nutrition), a
 * duplicate barcode (kept once), a record with an unusable code
 * (skipped) and a full record.
 */
export const SEARCH_EDGE_CASES = {
  count: 5,
  page: 1,
  page_size: 20,
  skip: 0,
  products: [
    {
      code: "4601111111111",
      brands: "Никак",
      // No product_name / product_name_ru / generic_name → skipped.
    },
    {
      code: "4602222222222",
      product_name: "Продукт без КБЖУ",
      brands: "Бренд",
      categories_tags: ["en:sodas"],
      // No nutriments at all → kept with unknown nutrition.
    },
    {
      code: "4603333333333",
      product_name: "Дубликат один",
      brands: "Бренд",
      nutriments: { "energy-kcal_100g": 50 },
      nutrition_data_per: "100g",
    },
    {
      code: "4603333333333",
      product_name: "Дубликат два",
      brands: "Бренд",
      nutriments: { "energy-kcal_100g": 51 },
      nutrition_data_per: "100g",
    },
    {
      code: "not-a-code",
      product_name: "Сломанный код",
      brands: "Бренд",
    },
  ],
} as const;

/* ---------------------------- SYNTHETIC ---------------------------- */

function variant(
  base: typeof AGUSHA_V3,
  mutate: (product: Record<string, unknown>) => void,
): Record<string, unknown> & { product: Record<string, unknown> } {
  const product = JSON.parse(JSON.stringify(base.product)) as Record<string, unknown>;
  mutate(product);
  return {
    ...JSON.parse(JSON.stringify(base)),
    product,
  } as Record<string, unknown> & { product: Record<string, unknown> };
}

/** No image field at all. */
export const NO_IMAGE_V3 = variant(AGUSHA_V3, (p) => {
  delete p.image_front_url;
});

/** No quantity fields at all. */
export const NO_QUANTITY_V3 = variant(AGUSHA_V3, (p) => {
  delete p.quantity;
  delete p.product_quantity;
  delete p.product_quantity_unit;
  delete p.serving_quantity;
  delete p.serving_size;
});

/** No brand and no name — only nutrition identifies the product. */
export const NO_BRAND_NO_NAME_V3 = variant(AGUSHA_V3, (p) => {
  delete p.brands;
  delete p.product_name;
  delete p.product_name_ru;
  delete p.generic_name;
});

/** Nutrition present but protein missing (kJ only as well). */
export const NO_PROTEIN_V3 = variant(AGUSHA_V3, (p) => {
  const nutriments = p.nutriments as Record<string, unknown>;
  delete nutriments.proteins;
  delete nutriments.proteins_100g;
});

export const NO_FAT_V3 = variant(AGUSHA_V3, (p) => {
  const nutriments = p.nutriments as Record<string, unknown>;
  delete nutriments.fat;
  delete nutriments.fat_100g;
});

export const NO_CARBS_V3 = variant(AGUSHA_V3, (p) => {
  const nutriments = p.nutriments as Record<string, unknown>;
  delete nutriments.carbohydrates;
  delete nutriments.carbohydrates_100g;
});

/** No energy at all — the product exists but is unusable (Алёнка case). */
export const NO_NUTRITION_V3 = variant(AGUSHA_V3, (p) => {
  delete p.nutriments;
});

/** A serving smaller than the package. */
export const SMALL_SERVING_V3 = variant(AGUSHA_V3, (p) => {
  p.serving_quantity = 30;
  p.serving_size = "30 g";
});

/** Response whose code does not match the requested barcode. */
export const WRONG_CODE_V3 = JSON.parse(JSON.stringify(AGUSHA_V3)) as Record<
  string,
  unknown
>;
