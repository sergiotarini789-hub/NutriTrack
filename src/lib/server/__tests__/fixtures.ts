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

/* ------------------ REAL: text search (8C, Search-a-licious) ------------------ */

/**
 * REAL responses of the OFF Search-a-licious API
 * (GET https://search.openfoodfacts.org/search?q=…&langs=ru&page_size=…
 * &page=…&fields=code,product_name,product_name_ru,generic_name,brands,
 * quantity,nutriments,image_front_url,categories_tags — captured live
 * 2026-09-18, Stage 8C.0 spike). Envelope: hits[] (not products[]),
 * numeric page, count/page_count/is_count_exact metadata, and per-hit
 * differences from the legacy API: `brands` is an ARRAY, nutriments
 * carry only *_100g numeric keys, `quantity` is a string, and several
 * v3 fields (product_quantity, serving_size, nutrition_data_per,
 * ingredients_text) are not stored in the index at all. The
 * `debug` (Elasticsearch DSL mirror) field is omitted for brevity;
 * everything else is verbatim.
 */

export const SEARCH_DANISSIMO = {
  aggregations: null,
  charts: {},
  count: 23,
  facets: {},
  hits: [
    {
      brands: ["Даниссимо"],
      categories_tags: ["ru:творожный-продукт"],
      code: "4600605017333",
      generic_name:
        "Продукт творожный с шоколадом, «Даниссимо браво»",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/501/7333/front_ru.34.400.jpg",
      nutriments: {
        "carbohydrates_100g": 17.4,
        "energy-kcal_100g": 152,
        "energy-kj_100g": 639,
        "fat_100g": 6.7,
        "proteins_100g": 5.6,
        "sugars_100g": 17.4,
      },
      product_name: "Даниссимо Творожный с изысканным шоколадом",
      product_name_ru: "Даниссимо Творожный с изысканным шоколадом",
      quantity: "130 g",
    },
    {
      // kJ only — no kcal in the index for this product.
      brands: ["Даниссимо"],
      categories_tags: [
        "en:dairies",
        "en:desserts",
        "en:dairy-desserts",
        "ru:5",
        "ru:продукт-творожный-мдж-5",
      ],
      code: "4600605017326",
      generic_name:
        "Продукт творожный с черникой «Даниссимо», массовая доля жира 5,5%",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/501/7326/front_ru.17.400.jpg",
      nutriments: {
        "carbohydrates_100g": 15.5,
        "energy-kj_100g": 555,
        "fat_100g": 5.5,
        "proteins_100g": 5.2,
      },
      product_name: "«Даниссимо» Творожный с отборной черникой",
      product_name_ru: "«Даниссимо» Творожный с отборной черникой",
      quantity: "130 g",
    },
    {
      // The Stage 8B/8C reference product (barcode cross-checked
      // against the live v3 product endpoint: 135 / 5.5 / 5.5 / 15.8).
      brands: ["Даниссимо"],
      categories_tags: [
        "en:dairies",
        "en:fermented-foods",
        "en:fermented-milk-products",
        "en:desserts",
        "en:dairy-desserts",
        "en:fermented-dairy-desserts",
      ],
      code: "4600605017265",
      generic_name: "Продукт творожный с киви, массовая доля жира 5,5 %",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/501/7265/front_ru.7.400.jpg",
      nutriments: {
        "carbohydrates_100g": 15.8,
        "energy-kcal_100g": 135,
        "energy-kj_100g": 567,
        "fat_100g": 5.5,
        "proteins_100g": 5.5,
      },
      product_name: "Даниссимо Творожный с сочным киви 130г",
      product_name_ru: "Даниссимо Творожный с сочным киви 130г",
      quantity: "130 г",
    },
    {
      // ml quantity with a g base unit (no nutrition_data_per in the
      // index) — the package unit is dropped gracefully, never faked.
      brands: ["Даниссимо"],
      code: "4600605022610",
      generic_name:
        "Мусс йогуртный взбитый «Воздушный» со вкусом клубники, двухслойный с клубникой. С массовой долей жира 5,4 %",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/502/2610/front_ru.11.400.jpg",
      nutriments: {
        "carbohydrates_100g": 15.4,
        "energy-kj_100g": 526,
        "fat_100g": 5.4,
        "proteins_100g": 3.8,
      },
      product_name: "Даниссимо Воздушный Йогуртный мусс с клубникой",
      product_name_ru: "Даниссимо Воздушный Йогуртный мусс с клубникой",
      quantity: "135 мл",
    },
    {
      brands: ["Даниссимо"],
      categories_tags: [
        "ru:1",
        "ru:продукт-творожный-двухслойный-с-наполнителем-тирамису-даниссимо-массовая-доля-жира-5",
        "ru:продукт-творожный-двухслойный-с-наполнителем-тирамису-массовая-доля-жира-5",
      ],
      code: "4600605021316",
      generic_name:
        "Продукт творожный двухслойный с наполнителем «Тирамису» «Даниссимо», массовая доля жира 5,1 %",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/502/1316/front_ru.8.400.jpg",
      nutriments: {
        "carbohydrates_100g": 17,
        "energy-kj_100g": 568,
        "fat_100g": 5.1,
        "proteins_100g": 5.3,
      },
      product_name: "Творожный Десерт Тирамису",
      product_name_ru: "Творожный Десерт Тирамису",
      quantity: "140 г",
    },
  ],
  is_count_exact: true,
  page: 1,
  page_count: 5,
  page_size: 5,
  timed_out: false,
  took: 13,
  warnings: null,
} as const;

/** REAL page 4 of the same query — pagination shape + hits with NO
 * nutriments at all (unknown ≠ zero) and a missing brands array. */
export const SEARCH_DANISSIMO_PAGE4 = {
  aggregations: null,
  charts: {},
  count: 23,
  facets: {},
  hits: [
    {
      // No nutriments key — nutrition is unknown, not zero.
      brands: ["Danone"],
      code: "4600605022436",
      generic_name:
        "Продукт творожный \"Даниссимо\" со вкусом фисташкового мороженого, массовая доля жира 6,5%",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/502/2436/front_ru.17.400.jpg",
      product_name: "Даниссимо со вкусом Фисташковое мороженое",
      product_name_ru: "Даниссимо со вкусом Фисташковое мороженое",
      quantity: "130 g",
    },
    {
      // Compound quantity the strict parser rejects (no
      // product_quantity fallback in the index) — no package unit.
      brands: ["Danone"],
      categories_tags: [
        "en:dairies",
        "en:fermented-foods",
        "en:fermented-milk-products",
        "en:desserts",
        "en:dairy-desserts",
        "en:fermented-dairy-desserts",
        "en:yogurts",
        "ru:9-и-драже",
        "ru:9-и-драже-хрустящие-шарики-с-ягодным-вкусом",
        "ru:йогурт-даниссимо-фантазия-с-массовой-долей-жира-6",
        "ru:йогурт-с-массовой-долей-жира-6",
      ],
      code: "4600605021781",
      generic_name:
        "Йогурт «Даниссимо Фантазия», с массовой долей жира 6,9 % и драже Хрустящие шарики с ягодным вкусом",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/502/1781/front_ru.3.400.jpg",
      nutriments: {
        "carbohydrates_100g": 11.6,
        "energy-kj_100g": 505,
        "fat_100g": 6.9,
        "proteins_100g": 3.1,
      },
      product_name:
        "Даниссимо Фантазия Хрустящие шарики с ягодным вкусом 105г",
      product_name_ru:
        "Даниссимо Фантазия Хрустящие шарики с ягодным вкусом 105г",
      quantity: "105 г (93 г йогурт и 12 г наполнитель)",
    },
    {
      // Minimal hit: no brands, no quantity, no categories, no image.
      code: "4600605033982",
      product_name: "Даниссимо шарики микс",
      product_name_ru: "Даниссимо шарики микс",
    },
    {
      brands: ["Danone"],
      code: "4600605018248",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/501/8248/front_ru.3.400.jpg",
      product_name: "Даниссимо Фантазия Хлопья в шоколаде",
      product_name_ru: "Даниссимо Фантазия Хлопья в шоколаде",
    },
    {
      code: "4600605030752",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/503/0752/front_ru.3.400.jpg",
      product_name: "Йогурт творожный даниссимо мороженое крем-брюле 110г",
      product_name_ru:
        "Йогурт творожный даниссимо мороженое крем-брюле 110г",
    },
  ],
  is_count_exact: true,
  page: 4,
  page_count: 5,
  page_size: 5,
  timed_out: false,
  took: 5,
  warnings: null,
} as const;

/** REAL capture — макфа: brands-casing variants, a unit-less quantity
 * ("400"), macros without any energy field, and a hit without brands. */
export const SEARCH_MACFA = {
  aggregations: null,
  charts: {},
  count: 6,
  facets: {},
  hits: [
    {
      brands: ["Макфа"],
      code: "4601780000837",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/178/000/0837/front_ru.3.400.jpg",
      nutriments: {
        "carbohydrates_100g": 70.5,
        "energy-kcal_100g": 342,
        "fat_100g": 1.3,
        "proteins_100g": 12,
      },
      product_name: "Ракушки",
      product_name_ru: "Ракушки",
    },
    {
      brands: ["Макфа"],
      categories_tags: [
        "en:plant-based-foods-and-beverages",
        "en:plant-based-foods",
        "en:cereals-and-potatoes",
        "en:cereals-and-their-products",
        "en:flours",
        "en:cereal-flours",
        "en:wheat-flours",
        "en:bread-flours",
        "en:wheat-bread-flour",
        "ru:мука-пшеничная-хлебопекарная-высший-сорт",
      ],
      code: "4601780002565",
      generic_name: "Мука пшеничная хлебопекарная высший сорт",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/178/000/2565/front.3.400.jpg",
      nutriments: {
        "carbohydrates_100g": 70.6,
        "energy-kcal_100g": 334,
        "energy-kj_100g": 1398,
        "fat_100g": 1.1,
        "proteins_100g": 10.3,
      },
      product_name: "Мука пшеничная хлебопекарная высший сорт",
      product_name_ru: "Мука пшеничная хлебопекарная высший сорт",
      quantity: "2 kg",
    },
    {
      brands: ["Макфа"],
      code: "4601780016739",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/178/001/6739/front_ru.3.400.jpg",
      nutriments: {
        "carbohydrates_100g": 73.2,
        "energy-kcal_100g": 367,
        "fat_100g": 1.3,
        "proteins_100g": 15.5,
      },
      product_name: "Макароны Триколлини",
      product_name_ru: "Макароны Триколлини",
    },
    {
      // Macros present but NO energy field at all → unknown nutrition
      // for NutriTrack (the energy value must not be invented).
      brands: ["макфа"],
      categories_tags: [
        "en:plant-based-foods-and-beverages",
        "en:plant-based-foods",
        "en:cereals-and-potatoes",
        "en:cereals-and-their-products",
        "en:pastas",
        "en:cereal-pastas",
        "en:dry-pastas",
        "en:durum-wheat-pasta",
        "en:spaghetti",
        "en:durum-wheat-spaghetti",
      ],
      code: "4601780010508",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/178/001/0508/front_ru.3.400.jpg",
      nutriments: {
        "carbohydrates_100g": 70.5,
        "fat_100g": 1.3,
        "proteins_100g": 12,
        "salt_100g": 0,
        "sodium_100g": 0,
      },
      product_name: "спагетти",
      product_name_ru: "спагетти",
      quantity: "400",
    },
    {
      // No brands, no nutriments — kept as a nutritionless product.
      code: "4601780005443",
      product_name: "Пшено макфа",
      product_name_ru: "Пшено макфа",
    },
    {
      brands: ["MAKFA"],
      code: "4601780000790",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/178/000/0790/front_ru.4.400.jpg",
      nutriments: {
        "carbohydrates_100g": 7.1,
        "energy-kcal_100g": 350,
        "energy-kj_100g": 1470,
        "fat_100g": 1.5,
        "proteins_100g": 12,
        "salt_100g": 1.5,
        "sodium_100g": 0.6,
      },
      product_name: "Макароны \"Макфа\"",
      product_name_ru: "Макароны \"Макфа\"",
      quantity: "450 г",
    },
  ],
  is_count_exact: true,
  page: 1,
  page_count: 1,
  page_size: 6,
  timed_out: false,
  took: 5,
  warnings: null,
} as const;

/** REAL capture — молоко: kJ-only dairy (conversion required), a
 * unit-less quantity ("1000") and a cramped "1,9л" quantity. */
export const SEARCH_MOLOKO = {
  aggregations: null,
  charts: {},
  count: 446,
  facets: {},
  hits: [
    {
      brands: ["Русское молоко"],
      categories_tags: [
        "en:dairies",
        "en:milks",
        "en:homogenized-milks",
        "en:uht-milks",
        "ru:молоко-питьевое-ультрапастеризованное",
        "ru:молоко-питьевое-с-массовой-долей-жира-1-5-ультрапастеризованное",
        "ru:молоко-питьевое-ультрапастеризованное-ультравысокотемпературно-обработанное",
      ],
      code: "4640017350413",
      generic_name:
        "Молоко питьевое ультрапастеризованное с массовой долей жира 3,2 %",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/464/001/735/0413/front_ru.18.400.jpg",
      nutriments: {
        "carbohydrates_100g": 4.7,
        "energy-kj_100g": 190,
        "fat_100g": 1.5,
        "proteins_100g": 3,
      },
      product_name: "Молоко 1,5 %",
      product_name_ru: "Молоко 1,5 %",
      quantity: "970 ml",
    },
    {
      brands: ["Русское молоко"],
      categories_tags: [
        "en:dairies",
        "en:milks",
        "en:homogenized-milks",
        "en:uht-milks",
        "ru:молоко-питьевое-ультрапастеризованное",
        "ru:молоко-питьевое-с-массовой-долей-жира-3-2-ультрапастеризованное",
        "ru:молоко-питьевое-ультрапастеризованное-ультравысокотемпературно-обработанное",
      ],
      code: "4640017350444",
      generic_name:
        "Молоко питьевое ультрапастеризованное с массовой долей жира 3,2 %",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/464/001/735/0444/front_ru.13.400.jpg",
      nutriments: {
        "carbohydrates_100g": 4.7,
        "energy-kj_100g": 250,
        "fat_100g": 3.2,
        "proteins_100g": 3,
      },
      product_name: "Молоко 3,2 %",
      product_name_ru: "Молоко 3,2 %",
      quantity: "970 ml",
    },
    {
      brands: ["Северное молоко"],
      categories_tags: [
        "en:dairies",
        "en:milks",
        "en:pasteurised-milks",
        "ru:молоко-питьевое",
        "ru:молоко-питьевое-пастеризованное",
        "ru:молоко-питьевое-с-массовой-долей-жира-2-5-пастеризованное",
      ],
      code: "4600742011041",
      generic_name: "Молоко питьевое пастеризованное 2,5%",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/074/201/1041/front.7.400.jpg",
      nutriments: {
        "carbohydrates_100g": 4.7,
        "energy-kj_100g": 223,
        "fat_100g": 2.5,
        "proteins_100g": 3,
      },
      product_name: "Молоко питьевое пастеризованное с массовой долей жира 2,5%",
      product_name_ru:
        "Молоко питьевое пастеризованное с массовой долей жира 2,5%",
      quantity: "1000 g",
    },
    {
      // No nutriments at all.
      brands: ["северное молоко"],
      categories_tags: [
        "en:dairies",
        "en:milks",
        "en:homogenized-milks",
        "en:uht-milks",
        "ru:молоко-питьевое-ультрапастеризованное",
        "ru:молоко-питьевое-с-массовой-долей-жира-3-2-ультрапастеризованное",
      ],
      code: "4600742011072",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/074/201/1072/front_ru.3.400.jpg",
      product_name: "молоко",
      product_name_ru: "молоко",
      quantity: "1000",
    },
    {
      brands: ["Молоко"],
      code: "4870003213136",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/487/000/321/3136/front_ru.3.400.jpg",
      product_name: "Любимое",
      product_name_ru: "Любимое",
      quantity: "1,9л",
    },
  ],
  is_count_exact: true,
  page: 1,
  page_count: 90,
  page_size: 5,
  timed_out: false,
  took: 6,
  warnings: null,
} as const;

/** REAL capture — данон: multi-brand arrays, Bulgarian products, and
 * float noise from the index (2.799999952316284). */
export const SEARCH_DANON = {
  aggregations: null,
  charts: {},
  count: 15,
  facets: {},
  hits: [
    {
      brands: ["Данон"],
      code: "4600605032824",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/503/2824/front_ru.4.400.jpg",
      nutriments: {
        "carbohydrates_100g": 5.3,
        "energy-kcal_100g": 51,
        "fat_100g": 1.8,
        "proteins_100g": 3.5,
      },
      product_name: "Биойогурт АктиБио",
      product_name_ru: "Биойогурт АктиБио",
    },
    {
      brands: ["Данон"],
      code: "4820226160892",
      nutriments: {
        "carbohydrates_100g": 11,
        "energy-kcal_100g": 69,
        "fat_100g": 1.5,
        "fiber_100g": 1,
        "proteins_100g": 2.799999952316284,
        "saturated-fat_100g": 1,
        "sugars_100g": 10.699999809265137,
      },
      product_name: "Йогурт",
    },
    {
      brands: ["Danone", "Данон"],
      categories_tags: [
        "en:dairies",
        "en:fermented-foods",
        "en:fermented-milk-products",
        "ru:6",
        "ru:продукт-творожный-с-грушей-и-бананом-массовая-доля-жира-3",
      ],
      code: "4600605020104",
      generic_name:
        "Продукт творожный с грушей и бананом, массовая доля жира 3,6 %",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/460/060/502/0104/front_ru.10.400.jpg",
      nutriments: {
        "carbohydrates_100g": 13.2,
        "energy-kj_100g": 465,
        "fat_100g": 3.6,
        "proteins_100g": 6.3,
        "sugars_100g": 8.1,
      },
      product_name: "Творожный (груша и банан)",
      product_name_ru: "Творожный (груша и банан)",
      quantity: "170 г",
    },
    {
      // No nutriments, no image, no quantity.
      brands: ["Данон", "Danone"],
      categories_tags: [
        "en:dairies",
        "en:fermented-foods",
        "en:fermented-milk-products",
        "en:desserts",
        "en:dairy-desserts",
        "en:fermented-dairy-desserts",
        "en:milks",
        "en:fermented-dairy-desserts-with-fruits",
        "en:yogurts",
        "en:fruit-yogurts",
        "en:мляко",
      ],
      code: "3800048308727",
      product_name: "Активиа Ленено семе и Сушена кайсия",
    },
    {
      brands: ["ДАНОН", "Danette"],
      categories_tags: ["en:desserts", "en:десерт"],
      code: "3800048305238",
      image_front_url:
        "https://images.openfoodfacts.org/images/products/380/004/830/5238/front_bg.5.400.jpg",
      nutriments: {
        "carbohydrates_100g": 23.3,
        "energy-kcal_100g": 123,
        "energy-kj_100g": 513,
        "fat_100g": 1.9,
        "proteins_100g": 3.2,
        "salt_100g": 0.12,
        "saturated-fat_100g": 1.4,
        "sodium_100g": 0.048,
        "sugars_100g": 23.2,
      },
      product_name: "Крем карамел danette",
      quantity: "4 x 125 g",
    },
  ],
  is_count_exact: true,
  page: 1,
  page_count: 3,
  page_size: 5,
  timed_out: false,
  took: 4,
  warnings: null,
} as const;

/**
 * SYNTHETIC Search-a-licious page exercising the guard rails: a
 * nameless record (skipped), a nutritionless record (kept, unknown
 * nutrition), a duplicate barcode (kept once), a record with an
 * unusable code (skipped), plus the brands shapes (array / string /
 * missing) and a product_name_ru override.
 */
export const SEARCH_EDGE_CASES = {
  count: 7,
  hits: [
    {
      code: "4601111111111",
      brands: ["Никак"],
      // No product_name / product_name_ru / generic_name → skipped.
    },
    {
      code: "4602222222222",
      product_name: "Продукт без КБЖУ",
      brands: ["Бренд"],
      categories_tags: ["en:sodas"],
      // No nutriments at all → kept with unknown nutrition.
    },
    {
      code: "4603333333333",
      product_name: "Дубликат один",
      brands: ["Бренд"],
      nutriments: { "energy-kcal_100g": 50 },
    },
    {
      code: "4603333333333",
      product_name: "Дубликат два",
      brands: ["Бренд"],
      nutriments: { "energy-kcal_100g": 51 },
    },
    {
      code: "not-a-code",
      product_name: "Сломанный код",
      brands: ["Бренд"],
    },
    {
      // Legacy-style STRING brands must keep working (adapter passes
      // them through untouched).
      code: "4604444444444",
      product_name: "Строковый бренд",
      brands: "Домик в деревне, Вимм-Билль-Данн",
      nutriments: { "energy-kcal_100g": 60 },
    },
    {
      // product_name_ru wins over product_name (existing bestName
      // rule, exercised through the search path).
      code: "4605555555555",
      product_name: "English name",
      product_name_ru: "Русское название",
      nutriments: { "energy-kj_100g": 418.4 },
    },
  ],
  is_count_exact: true,
  page: 1,
  page_count: 1,
  page_size: 20,
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
