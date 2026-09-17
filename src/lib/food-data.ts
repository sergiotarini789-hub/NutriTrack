import {
  Apple,
  Bean,
  Beef,
  Candy,
  Carrot,
  Cherry,
  CookingPot,
  Croissant,
  CupSoda,
  Drumstick,
  Droplet,
  Egg,
  Fish,
  Milk,
  Nut,
  Sandwich,
  UserRound,
  Wheat,
} from "lucide-react";
import type {
  FoodCategory,
  FoodCategoryId,
  FoodProduct,
  FoodServing,
  FoodUnit,
  GenericFood,
} from "./types";

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const CATEGORIES: FoodCategory[] = [
  { id: "cereals", name: "Крупы и зерновые", icon: Wheat },
  { id: "pasta", name: "Макаронные изделия", icon: CookingPot },
  { id: "meat", name: "Мясо", icon: Beef },
  { id: "poultry", name: "Птица", icon: Drumstick },
  { id: "fish", name: "Рыба и морепродукты", icon: Fish },
  { id: "eggs", name: "Яйца", icon: Egg },
  { id: "dairy", name: "Молочные продукты", icon: Milk },
  { id: "vegetables", name: "Овощи", icon: Carrot },
  { id: "fruits", name: "Фрукты", icon: Apple },
  { id: "berries", name: "Ягоды", icon: Cherry },
  { id: "bakery", name: "Хлеб и выпечка", icon: Croissant },
  { id: "nuts", name: "Орехи и семена", icon: Nut },
  { id: "legumes", name: "Бобовые", icon: Bean },
  { id: "oils", name: "Масла и соусы", icon: Droplet },
  { id: "drinks", name: "Напитки", icon: CupSoda },
  { id: "sweets", name: "Сладости", icon: Candy },
  { id: "ready", name: "Готовые продукты", icon: Sandwich },
  { id: "user", name: "Мои продукты", icon: UserRound },
];

const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: FoodCategoryId): FoodCategory {
  return CATEGORY_BY_ID.get(id) ?? CATEGORIES[0];
}

/** Icon shown for a food (per category). */
export function categoryIcon(category: FoodCategoryId) {
  return getCategory(category).icon;
}

/* ------------------------------------------------------------------ */
/* Units and servings                                                  */
/* ------------------------------------------------------------------ */

export const G_UNIT: FoodUnit = { key: "g", kind: "g", label: "г", base: 1 };
export const ML_UNIT: FoodUnit = { key: "ml", kind: "ml", label: "мл", base: 1 };

/** 1 шт ≈ base grams/ml. */
const piece = (base: number): FoodUnit => ({
  key: "piece",
  kind: "piece",
  label: "шт",
  base,
});

/** A custom piece-like unit with Russian plural forms, e.g. ломтик. */
const unit = (
  key: string,
  kind: FoodUnit["kind"],
  label: string,
  base: number,
  few: string,
  many: string,
): FoodUnit => ({ key, kind, label, base, few, many });

const slice = (base: number) => unit("slice", "slice", "ломтик", base, "ломтика", "ломтиков");
const tsp = (base: number) => unit("tsp", "serving", "ч. л.", base, "ч. л.", "ч. л.");
const tbsp = (base: number) => unit("tbsp", "serving", "ст. л.", base, "ст. л.", "ст. л.");

/** Quick serving shorthand. */
const sv = (amount: number, unitKey: string): FoodServing => ({ amount, unitKey });

/* ------------------------------------------------------------------ */
/* Food builder                                                        */
/* ------------------------------------------------------------------ */

/** [calories, protein, fat, carbs] per 100 g or per 100 ml. */
type Macros = [number, number, number, number];

interface FoodSeed {
  /** true when the food is a liquid measured in ml. */
  ml?: boolean;
  /** Extra units besides the base one (piece, spoons, ...). */
  units?: FoodUnit[];
  /** Quick serving chips. */
  servings?: FoodServing[];
  /** Default amount pre-filled in the editor. */
  default?: FoodServing;
  alias?: string[];
}

function food(
  id: string,
  name: string,
  category: FoodCategoryId,
  macros: Macros,
  seed: FoodSeed = {},
): GenericFood {
  const baseUnitKey = seed.ml ? "ml" : "g";
  return {
    type: "generic",
    id,
    name,
    category,
    aliases: seed.alias ?? [],
    calories: macros[0],
    protein: macros[1],
    fat: macros[2],
    carbs: macros[3],
    baseUnit: seed.ml ? "ml" : "g",
    units: [...(seed.units ?? []), seed.ml ? ML_UNIT : G_UNIT],
    servingOptions:
      seed.servings ??
      (seed.ml
        ? [sv(100, "ml"), sv(200, "ml"), sv(250, "ml"), sv(500, "ml")]
        : [sv(50, "g"), sv(100, "g"), sv(150, "g"), sv(200, "g")]),
    defaultServing: seed.default ?? { amount: seed.ml ? 250 : 100, unitKey: baseUnitKey },
    sourceType: "generic",
    isBranded: false,
  };
}

/* ------------------------------------------------------------------ */
/* Food database (reference values per 100 g / 100 ml)                 */
/* ------------------------------------------------------------------ */

/** Built-in reference foods — all generic (no manufacturer data). */
export const foods: GenericFood[] = [
  /* --- Крупы и зерновые --- */
  food("buckwheat", "Гречка (сухая)", "cereals", [330, 12.6, 3.3, 62.1], { alias: ["греча", "гречка"] }),
  food("buckwheat-cooked", "Гречка (варёная)", "cereals", [110, 4.2, 1.1, 21.3], { alias: ["гречка"] }),
  food("rice", "Рис белый (сухой)", "cereals", [344, 6.7, 0.7, 78.9], { alias: ["рис"] }),
  food("rice-cooked", "Рис белый (варёный)", "cereals", [130, 2.2, 0.5, 28.2], { alias: ["рис"] }),
  food("brown-rice", "Рис бурый (сухой)", "cereals", [337, 7.4, 2.8, 72.3], { alias: ["рис"] }),
  food("brown-rice-cooked", "Рис бурый (варёный)", "cereals", [123, 2.7, 0.9, 25.6], { alias: ["рис"] }),
  food("oatmeal", "Овсяные хлопья (сухие)", "cereals", [352, 12.3, 6.2, 61.8], { alias: ["овсянка", "геркулес"] }),
  food("oatmeal-water", "Овсяная каша на воде", "cereals", [88, 3.0, 1.7, 15.0], { alias: ["овсянка"] }),
  food("oatmeal-milk", "Овсяная каша на молоке", "cereals", [105, 3.4, 3.4, 14.7], { alias: ["овсянка"] }),
  food("pearl-barley", "Перловая крупа (сухая)", "cereals", [324, 10.0, 1.1, 73.7], { alias: ["перловка"] }),
  food("pearl-barley-cooked", "Перловка (варёная)", "cereals", [109, 3.1, 0.4, 22.2], { alias: ["перловка"] }),
  food("millet", "Пшённая крупа (сухая)", "cereals", [348, 11.5, 3.3, 66.5], { alias: ["пшено"] }),
  food("millet-cooked", "Пшённая каша на воде", "cereals", [90, 3.0, 0.7, 17.0], { alias: ["пшено"] }),
  food("bulgur", "Булгур (сухой)", "cereals", [342, 12.3, 1.3, 68.9], { alias: ["булгур"] }),
  food("bulgur-cooked", "Булгур (варёный)", "cereals", [83, 3.0, 0.2, 18.6]),
  food("quinoa", "Киноа (сухая)", "cereals", [368, 14.1, 6.1, 57.2]),
  food("quinoa-cooked", "Киноа (варёная)", "cereals", [120, 4.4, 1.9, 21.3]),
  food("semolina", "Манная крупа (сухая)", "cereals", [326, 10.3, 1.0, 67.3], { alias: ["манка"] }),
  food("semolina-porridge", "Манная каша на молоке", "cereals", [98, 3.0, 3.2, 14.0], { alias: ["манка"] }),
  food("corn-grits", "Кукурузная крупа (сухая)", "cereals", [328, 8.3, 1.2, 71.0], { alias: ["полента"] }),
  food("barley-groats", "Ячневая крупа (сухая)", "cereals", [313, 10.0, 1.3, 65.4]),
  food("couscous", "Кускус (сухой)", "cereals", [376, 12.8, 0.6, 72.4]),
  food("couscous-cooked", "Кускус (варёный)", "cereals", [112, 3.8, 0.2, 23.2]),
  food("muesli", "Мюсли", "cereals", [355, 9.0, 6.5, 66.0]),
  food("granola", "Гранола", "cereals", [420, 10.0, 14.0, 64.0]),

  /* --- Макаронные изделия --- */
  food("pasta", "Макароны (сухие)", "pasta", [350, 11.8, 1.3, 73.3], { alias: ["макароны", "паста", "вермишель"] }),
  food("pasta-cooked", "Макароны (варёные)", "pasta", [135, 4.5, 0.5, 26.8], { alias: ["макароны", "паста"] }),
  food("spaghetti", "Спагетти (сухие)", "pasta", [350, 12.0, 1.1, 71.5], { alias: ["спагетти"] }),
  food("spaghetti-cooked", "Спагетти (варёные)", "pasta", [158, 5.8, 0.9, 30.9], { alias: ["спагетти"] }),
  food("egg-noodles", "Лапша яичная (сухая)", "pasta", [380, 11.3, 4.0, 69.0], { alias: ["лапша"] }),
  food("instant-noodles", "Лапша быстрого приготовления", "pasta", [448, 9.0, 17.0, 60.0], { alias: ["лапша"] }),
  food("wholewheat-pasta", "Паста цельнозерновая (сухая)", "pasta", [348, 13.5, 2.5, 65.0], { alias: ["паста", "макароны"] }),
  food("wholewheat-pasta-cooked", "Паста цельнозерновая (варёная)", "pasta", [124, 4.8, 0.9, 23.5], { alias: ["паста"] }),

  /* --- Мясо --- */
  food("beef", "Говядина (сырая)", "meat", [218, 18.6, 16.0, 0], { alias: ["говядина"] }),
  food("beef-tenderloin", "Говяжья вырезка (сырая)", "meat", [156, 19.5, 8.0, 0], { alias: ["говядина"] }),
  food("veal", "Телятина (сырая)", "meat", [131, 19.7, 5.0, 0]),
  food("pork", "Свинина (сырая)", "meat", [297, 16.4, 23.9, 0]),
  food("pork-tenderloin", "Свиная вырезка (сырая)", "meat", [142, 19.4, 7.1, 0]),
  food("lamb", "Баранина (сырая)", "meat", [209, 15.6, 16.3, 0]),
  food("rabbit", "Кролик (сырой)", "meat", [155, 21.0, 8.0, 0], { alias: ["крольчатина"] }),
  food("beef-liver", "Печень говяжья (сырая)", "meat", [127, 17.9, 3.6, 5.4], { alias: ["печень"] }),
  food("beef-tongue", "Язык говяжий (отварной)", "meat", [146, 12.1, 10.5, 0]),
  food("beef-mince", "Фарш говяжий (сырой)", "meat", [254, 17.2, 20.0, 0], { alias: ["фарш"] }),
  food("pork-mince", "Фарш свиной (сырой)", "meat", [300, 14.6, 27.8, 0], { alias: ["фарш"] }),
  food("salo", "Сало", "meat", [797, 2.4, 89.0, 0]),

  /* --- Птица --- */
  food("chicken-breast", "Куриная грудка (сырая)", "poultry", [113, 23.6, 1.9, 0.4], { alias: ["курица", "куриное филе", "филе"] }),
  food("chicken-breast-cooked", "Куриная грудка (варёная)", "poultry", [137, 29.6, 1.8, 0.4], { alias: ["курица"] }),
  food("chicken-thigh", "Куриное бедро (без кожи, сырое)", "poultry", [119, 19.0, 5.0, 0], { alias: ["курица"] }),
  food("chicken-thigh-skin", "Куриное бедро (с кожей, сырое)", "poultry", [211, 16.5, 15.5, 0], { alias: ["курица"] }),
  food("chicken-drumstick", "Куриная голень (без кожи, сырая)", "poultry", [120, 19.0, 5.2, 0], { alias: ["курица"] }),
  food("chicken-wing", "Куриное крыло (с кожей, сырое)", "poultry", [222, 18.3, 16.0, 0], { alias: ["курица"] }),
  food("chicken-whole", "Курица (тушка, сырая)", "poultry", [190, 16.0, 14.0, 0], { alias: ["курица"] }),
  food("turkey-breast", "Индейка (филе грудки, сырое)", "poultry", [104, 19.2, 3.7, 0], { alias: ["индейка"] }),
  food("turkey-thigh", "Индейка (бедро, сырое)", "poultry", [130, 18.5, 6.0, 0], { alias: ["индейка"] }),
  food("chicken-liver", "Печень куриная (сырая)", "poultry", [136, 20.0, 5.9, 0.7], { alias: ["печень"] }),
  food("duck", "Утка (мясо с кожей, сырое)", "poultry", [337, 19.7, 28.4, 0]),
  food("chicken-mince", "Фарш куриный (сырой)", "poultry", [143, 17.0, 8.0, 0], { alias: ["фарш", "курица"] }),

  /* --- Рыба и морепродукты --- */
  food("tuna", "Тунец (свежий)", "fish", [108, 23.0, 1.0, 0], { alias: ["тунец"] }),
  food("tuna-canned", "Тунец (консервы в собственном соку)", "fish", [96, 21.0, 1.0, 0], { alias: ["тунец"] }),
  food("mackerel", "Скумбрия (сырая)", "fish", [191, 18.0, 13.2, 0]),
  food("mackerel-smoked", "Скумбрия копчёная", "fish", [317, 22.1, 23.8, 0]),
  food("salmon", "Лосось (сёмга, сырой)", "fish", [208, 20.4, 13.4, 0], { alias: ["лосось", "сёмга", "семга"] }),
  food("smoked-salmon", "Лосось копчёный", "fish", [117, 20.5, 4.5, 0], { alias: ["лосось"] }),
  food("pink-salmon", "Горбуша (сырая)", "fish", [140, 20.5, 6.5, 0]),
  food("chum", "Кета (сырая)", "fish", [127, 22.0, 4.3, 0]),
  food("trout", "Форель (сырая)", "fish", [119, 19.2, 3.3, 0]),
  food("hake", "Хек (сырой)", "fish", [82, 16.6, 2.2, 0]),
  food("pollock", "Минтай (сырой)", "fish", [72, 15.9, 0.9, 0]),
  food("cod", "Треска (сырая)", "fish", [78, 17.8, 0.7, 0]),
  food("herring", "Сельдь (сырая)", "fish", [158, 17.9, 9.0, 0], { alias: ["селёдка"] }),
  food("herring-salted", "Сельдь (солёная)", "fish", [217, 17.5, 16.5, 0], { alias: ["селёдка"] }),
  food("carp", "Карп (сырой)", "fish", [112, 16.0, 5.3, 0]),
  food("pike-perch", "Судак (сырой)", "fish", [84, 18.5, 1.1, 0]),
  food("pike", "Щука (сырая)", "fish", [82, 18.4, 1.1, 0]),
  food("sea-bass", "Окунь морской (сырой)", "fish", [103, 18.0, 3.3, 0], { alias: ["окунь"] }),
  food("flounder", "Камбала (сырая)", "fish", [83, 16.5, 1.5, 0]),
  food("capelin", "Мойва (сырая)", "fish", [157, 13.4, 11.5, 0]),
  food("shrimp", "Креветки (варёные)", "fish", [99, 20.9, 1.7, 0], { alias: ["креветки"] }),
  food("squid", "Кальмар (тушка, сырая)", "fish", [92, 15.6, 1.4, 3.0], { alias: ["кальмар"] }),
  food("mussels", "Мидии (варёные)", "fish", [86, 11.9, 2.2, 3.7], { alias: ["мидии"] }),
  food("red-caviar", "Икра красная", "fish", [250, 31.0, 13.0, 1.0], { alias: ["икра"] }),
  food("crab-sticks", "Крабовые палочки", "fish", [95, 9.0, 1.2, 15.0], { alias: ["сурими"] }),
  food("canned-saira", "Сайра (консервы в масле)", "fish", [283, 18.0, 23.5, 0]),

  /* --- Яйца --- */
  food("egg", "Яйцо куриное", "eggs", [157, 12.7, 11.5, 0.7], {
    units: [piece(50)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(3, "piece"), sv(50, "g"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["яйца"],
  }),
  food("egg-white", "Яичный белок", "eggs", [48, 11.0, 0.2, 0.7], {
    units: [piece(33)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(3, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["белок"],
  }),
  food("egg-yolk", "Яичный желток", "eggs", [352, 16.2, 30.8, 1.8], {
    units: [piece(17)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["желток"],
  }),
  food("quail-egg", "Яйцо перепелиное", "eggs", [158, 13.0, 11.1, 0.4], {
    units: [piece(12)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(3, "piece"), sv(5, "piece")],
    default: sv(1, "piece"),
    alias: ["перепелиные яйца"],
  }),

  /* --- Молочные продукты --- */
  food("milk-2.5", "Молоко 2,5%", "dairy", [52, 2.8, 2.5, 4.7], { ml: true, alias: ["молоко"] }),
  food("milk-3.2", "Молоко 3,2%", "dairy", [60, 2.9, 3.2, 4.7], { ml: true, alias: ["молоко"] }),
  food("milk-0.5", "Молоко обезжиренное 0,5%", "dairy", [35, 3.0, 0.5, 4.9], { ml: true, alias: ["молоко"] }),
  food("goat-milk", "Молоко козье", "dairy", [68, 3.0, 4.2, 4.5], { ml: true, alias: ["молоко"] }),
  food("kefir-1", "Кефир 1%", "dairy", [40, 3.0, 1.0, 4.0], { ml: true }),
  food("kefir-2.5", "Кефир 2,5%", "dairy", [50, 2.9, 2.5, 4.0], { ml: true }),
  food("kefir-0", "Кефир обезжиренный", "dairy", [30, 3.0, 0.1, 3.8], { ml: true }),
  food("ryazhenka", "Ряженка 2,5%", "dairy", [54, 2.9, 2.5, 4.2], { ml: true }),
  food("yogurt-natural", "Йогурт натуральный 2%", "dairy", [60, 4.5, 2.0, 6.0], { alias: ["йогурт"] }),
  food("greek-yogurt", "Греческий йогурт 2%", "dairy", [73, 9.5, 2.0, 4.0], { alias: ["йогурт"] }),
  food("cottage-cheese", "Творог 5%", "dairy", [121, 17.2, 5.0, 1.8], { alias: ["творог"] }),
  food("cottage-cheese-9", "Творог 9%", "dairy", [159, 16.7, 9.0, 2.0], { alias: ["творог"] }),
  food("cottage-cheese-0", "Творог обезжиренный 0%", "dairy", [71, 16.5, 0.6, 1.3], { alias: ["творог"] }),
  food("sour-cream-20", "Сметана 20%", "dairy", [204, 2.8, 20.0, 3.4], { alias: ["сметана"] }),
  food("sour-cream-10", "Сметана 10%", "dairy", [115, 3.0, 10.0, 2.9], { alias: ["сметана"] }),
  food("cream-10", "Сливки 10%", "dairy", [118, 3.0, 10.0, 4.0], { ml: true, alias: ["сливки"] }),
  food("cream-20", "Сливки 20%", "dairy", [205, 2.8, 20.0, 3.7], { ml: true, alias: ["сливки"] }),
  food("condensed-milk", "Молоко сгущённое с сахаром", "dairy", [320, 7.2, 8.5, 55.5], {
    units: [tsp(12), tbsp(35)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(50, "g"), sv(100, "g")],
    default: sv(1, "tbsp"),
    alias: ["сгущёнка"],
  }),
  food("butter", "Масло сливочное 82,5%", "dairy", [748, 0.5, 82.5, 0.8], {
    units: [tsp(7), tbsp(20)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(10, "g"), sv(20, "g")],
    default: sv(1, "tsp"),
    alias: ["масло"],
  }),
  food("processed-cheese", "Плавленый сыр", "dairy", [290, 12.0, 24.0, 4.0], { alias: ["сыр"] }),
  food("hard-cheese", "Сыр твёрдый (типа «Российского»)", "dairy", [364, 24.1, 29.5, 0.3], { alias: ["сыр"] }),
  food("parmesan", "Сыр Пармезан", "dairy", [392, 35.7, 25.8, 3.2], { alias: ["сыр"] }),
  food("mozzarella", "Сыр Моцарелла", "dairy", [253, 18.1, 19.0, 2.4], { alias: ["сыр"] }),
  food("cream-cheese", "Сыр творожный сливочный", "dairy", [253, 6.0, 24.0, 4.0], { alias: ["сыр"] }),
  food("feta", "Сыр Фета", "dairy", [264, 14.2, 21.3, 4.1], { alias: ["сыр"] }),

  /* --- Овощи --- */
  food("potato", "Картофель (сырой)", "vegetables", [77, 2.0, 0.4, 16.3], { alias: ["картошка"] }),
  food("potato-boiled", "Картофель (варёный)", "vegetables", [82, 2.0, 0.3, 16.7], { alias: ["картошка"] }),
  food("carrot", "Морковь", "vegetables", [35, 1.3, 0.1, 6.9], { alias: ["морковка"] }),
  food("cucumber", "Огурец", "vegetables", [15, 0.8, 0.1, 2.5], { alias: ["огурцы"] }),
  food("tomato", "Помидор", "vegetables", [20, 1.1, 0.2, 3.7], { alias: ["помидоры", "томат", "томаты"] }),
  food("cabbage", "Капуста белокочанная", "vegetables", [28, 1.8, 0.1, 4.7], { alias: ["капуста"] }),
  food("cauliflower", "Капуста цветная", "vegetables", [30, 2.5, 0.3, 5.0], { alias: ["капуста"] }),
  food("broccoli", "Брокколи", "vegetables", [34, 2.8, 0.4, 6.6]),
  food("chinese-cabbage", "Капуста пекинская", "vegetables", [16, 1.2, 0.2, 2.0], { alias: ["капуста"] }),
  food("brussels-sprouts", "Капуста брюссельская", "vegetables", [43, 4.8, 0.3, 3.1], { alias: ["капуста"] }),
  food("onion", "Лук репчатый", "vegetables", [41, 1.4, 0.2, 8.2], { alias: ["лук"] }),
  food("green-onion", "Лук зелёный", "vegetables", [19, 1.3, 0.1, 3.2], { alias: ["лук"] }),
  food("bell-pepper", "Перец болгарский", "vegetables", [27, 1.3, 0.1, 5.3], { alias: ["перец"] }),
  food("beet", "Свёкла", "vegetables", [42, 1.5, 0.1, 8.8], { alias: ["свекла"] }),
  food("zucchini", "Кабачок", "vegetables", [24, 0.6, 0.3, 4.6], { alias: ["кабачки"] }),
  food("eggplant", "Баклажан", "vegetables", [24, 1.2, 0.1, 4.5], { alias: ["баклажаны"] }),
  food("pumpkin", "Тыква", "vegetables", [26, 1.0, 0.1, 4.4]),
  food("radish", "Редис", "vegetables", [20, 1.2, 0.1, 3.4], { alias: ["редиска"] }),
  food("garlic", "Чеснок", "vegetables", [143, 6.4, 0.5, 29.9], {
    units: [unit("clove", "piece", "зубчик", 5, "зубчика", "зубчиков")],
    servings: [sv(1, "clove"), sv(2, "clove"), sv(3, "clove"), sv(10, "g")],
    default: sv(1, "clove"),
  }),
  food("lettuce", "Салат листовой", "vegetables", [15, 1.4, 0.2, 1.3], { alias: ["салат"] }),
  food("spinach", "Шпинат", "vegetables", [23, 2.9, 0.4, 3.6]),
  food("champignon", "Шампиньоны", "vegetables", [27, 4.3, 1.0, 1.0], { alias: ["грибы"] }),
  food("corn-boiled", "Кукуруза (варёная)", "vegetables", [96, 3.4, 1.3, 21.0], { alias: ["кукуруза"] }),
  food("corn-canned", "Кукуруза консервированная", "vegetables", [119, 3.3, 1.4, 22.7], { alias: ["кукуруза"] }),
  food("green-beans", "Фасоль стручковая (зелёная)", "vegetables", [31, 1.8, 0.1, 7.0], { alias: ["фасоль"] }),
  food("olives", "Маслины (консервированные)", "vegetables", [115, 0.8, 10.7, 6.0], { alias: ["оливки"] }),

  /* --- Фрукты --- */
  food("banana", "Банан", "fruits", [89, 1.5, 0.2, 21.5], {
    units: [piece(120)],
    servings: [sv(1, "piece"), sv(0.5, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["бананы"],
  }),
  food("apple", "Яблоко", "fruits", [52, 0.4, 0.4, 9.8], {
    units: [piece(150)],
    servings: [sv(1, "piece"), sv(0.5, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["яблоки"],
  }),
  food("orange", "Апельсин", "fruits", [43, 0.9, 0.2, 8.1], {
    units: [piece(180)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["апельсины"],
  }),
  food("tangerine", "Мандарин", "fruits", [53, 0.8, 0.3, 11.5], {
    units: [piece(80)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(3, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["мандарины"],
  }),
  food("pear", "Груша", "fruits", [57, 0.4, 0.3, 10.3], {
    units: [piece(170)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["груши"],
  }),
  food("grapes", "Виноград", "fruits", [69, 0.6, 0.2, 16.8]),
  food("kiwi", "Киви", "fruits", [61, 1.1, 0.5, 14.7], {
    units: [piece(75)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("pineapple", "Ананас (свежий)", "fruits", [50, 0.4, 0.2, 10.6], { alias: ["ананас"] }),
  food("watermelon", "Арбуз", "fruits", [30, 0.6, 0.2, 7.6]),
  food("melon", "Дыня", "fruits", [35, 0.6, 0.3, 7.4]),
  food("peach", "Персик", "fruits", [46, 0.9, 0.3, 9.5], {
    units: [piece(120)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["персики"],
  }),
  food("apricot", "Абрикос", "fruits", [44, 0.9, 0.1, 9.0], {
    units: [piece(40)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(3, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["абрикосы"],
  }),
  food("plum", "Слива", "fruits", [46, 0.7, 0.3, 9.6], {
    units: [piece(30)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(3, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["сливы"],
  }),
  food("persimmon", "Хурма", "fruits", [67, 0.5, 0.3, 15.3], {
    units: [piece(200)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("pomegranate", "Гранат", "fruits", [72, 1.6, 0.7, 14.5], {
    units: [piece(170)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("mango", "Манго", "fruits", [60, 0.8, 0.4, 13.5], {
    units: [piece(200)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("lemon", "Лимон", "fruits", [34, 1.1, 0.3, 9.3], {
    units: [piece(60)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("grapefruit", "Грейпфрут", "fruits", [42, 0.8, 0.1, 10.7], {
    units: [piece(250)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("avocado", "Авокадо", "fruits", [160, 2.0, 14.7, 8.5], {
    units: [piece(150)],
    servings: [sv(1, "piece"), sv(0.5, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("dates", "Финики (сушёные)", "fruits", [277, 2.5, 0.5, 69.2], {
    units: [piece(7)],
    servings: [sv(1, "piece"), sv(3, "piece"), sv(5, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["финики"],
  }),
  food("raisins", "Изюм", "fruits", [262, 1.0, 0.5, 65.8]),
  food("dried-apricots", "Курага", "fruits", [215, 3.2, 0.6, 51.0], {
    units: [piece(10)],
    servings: [sv(1, "piece"), sv(5, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("prunes", "Чернослив", "fruits", [240, 2.2, 0.4, 63.9], {
    units: [piece(10)],
    servings: [sv(1, "piece"), sv(5, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),

  /* --- Ягоды --- */
  food("strawberry", "Клубника", "berries", [33, 0.8, 0.4, 7.7]),
  food("raspberry", "Малина", "berries", [46, 0.8, 0.5, 8.3]),
  food("blueberry", "Черника", "berries", [57, 0.7, 0.3, 14.5]),
  food("black-currant", "Смородина чёрная", "berries", [63, 1.0, 0.4, 7.3], { alias: ["смородина"] }),
  food("red-currant", "Смородина красная", "berries", [43, 0.6, 0.2, 8.0], { alias: ["смородина"] }),
  food("cherry", "Вишня", "berries", [52, 1.0, 0.3, 10.6]),
  food("sweet-cherry", "Черешня", "berries", [50, 1.2, 0.4, 10.6]),
  food("gooseberry", "Крыжовник", "berries", [45, 0.8, 0.4, 9.1]),
  food("lingonberry", "Брусника", "berries", [46, 0.7, 0.5, 8.2]),
  food("cranberry", "Клюква", "berries", [46, 0.5, 0.2, 11.5]),
  food("blackberry", "Ежевика", "berries", [43, 1.4, 0.5, 9.6]),

  /* --- Хлеб и выпечка --- */
  food("white-bread", "Хлеб белый (батон)", "bakery", [265, 7.6, 3.3, 50.0], {
    units: [slice(30)],
    servings: [sv(1, "slice"), sv(2, "slice"), sv(100, "g")],
    default: sv(1, "slice"),
    alias: ["батон", "хлеб"],
  }),
  food("rye-bread", "Хлеб ржаной", "bakery", [217, 6.6, 1.2, 44.5], {
    units: [slice(35)],
    servings: [sv(1, "slice"), sv(2, "slice"), sv(100, "g")],
    default: sv(1, "slice"),
    alias: ["хлеб"],
  }),
  food("borodinsky", "Хлеб Бородинский", "bakery", [208, 6.9, 1.3, 40.9], {
    units: [slice(35)],
    servings: [sv(1, "slice"), sv(2, "slice"), sv(100, "g")],
    default: sv(1, "slice"),
    alias: ["хлеб", "бородинский"],
  }),
  food("grain-bread", "Хлеб зерновой", "bakery", [230, 8.0, 3.0, 45.0], {
    units: [slice(30)],
    servings: [sv(1, "slice"), sv(2, "slice"), sv(100, "g")],
    default: sv(1, "slice"),
    alias: ["хлеб"],
  }),
  food("crispbread", "Хлебцы ржаные", "bakery", [300, 10.0, 2.5, 58.0], {
    units: [piece(10)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["хлебцы"],
  }),
  food("bun", "Булочка пшеничная", "bakery", [320, 7.5, 6.0, 60.0], {
    units: [piece(60)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["булка", "булочка"],
  }),
  food("baguette", "Багет", "bakery", [274, 8.0, 2.5, 53.0]),
  food("pita", "Пита", "bakery", [275, 9.0, 1.2, 55.0], {
    units: [piece(60)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("lavash", "Лаваш тонкий", "bakery", [277, 9.1, 1.1, 55.5], {
    units: [unit("piece", "piece", "лист", 50, "листа", "листов")],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("croissant", "Круассан", "bakery", [406, 8.2, 21.0, 46.0], {
    units: [piece(60)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),

  /* --- Орехи и семена --- */
  food("almonds", "Миндаль", "nuts", [609, 21.0, 53.0, 13.0], { alias: ["орехи"] }),
  food("walnuts", "Грецкий орех", "nuts", [654, 15.2, 65.2, 7.0], { alias: ["орехи"] }),
  food("cashews", "Кешью", "nuts", [600, 18.5, 48.5, 22.5], { alias: ["орехи"] }),
  food("hazelnuts", "Фундук", "nuts", [628, 15.0, 61.2, 16.7], { alias: ["орехи"] }),
  food("peanuts", "Арахис", "nuts", [567, 26.3, 49.2, 16.1], { alias: ["орехи"] }),
  food("pistachios", "Фисташки", "nuts", [560, 20.2, 45.3, 16.6], { alias: ["орехи"] }),
  food("pine-nuts", "Кедровые орехи", "nuts", [673, 14.0, 68.0, 9.0], { alias: ["орехи"] }),
  food("sunflower-seeds", "Семечки подсолнуха", "nuts", [601, 20.7, 52.9, 11.0], { alias: ["семечки"] }),
  food("pumpkin-seeds", "Семечки тыквенные", "nuts", [559, 30.2, 49.0, 10.7], { alias: ["семечки"] }),
  food("sesame", "Кунжут", "nuts", [563, 17.7, 49.7, 23.5]),
  food("flax-seeds", "Семена льна", "nuts", [534, 18.3, 42.2, 28.9], { alias: ["лён"] }),
  food("coconut", "Кокос (стружка)", "nuts", [660, 6.9, 64.5, 7.4]),
  food("peanut-butter", "Паста арахисовая", "nuts", [588, 25.0, 50.0, 20.0], {
    units: [tsp(10), tbsp(20)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(30, "g")],
    default: sv(1, "tbsp"),
    alias: ["арахисовая паста"],
  }),

  /* --- Бобовые --- */
  food("beans-dry", "Фасоль (сухая)", "legumes", [333, 21.0, 2.0, 47.0], { alias: ["фасоль"] }),
  food("beans-cooked", "Фасоль (варёная)", "legumes", [123, 7.8, 0.5, 21.0], { alias: ["фасоль"] }),
  food("peas-dry", "Горох (сухой)", "legumes", [323, 20.5, 2.0, 56.6], { alias: ["горох"] }),
  food("peas-cooked", "Горох (варёный)", "legumes", [118, 8.3, 0.4, 19.7], { alias: ["горох"] }),
  food("lentils-dry", "Чечевица (сухая)", "legumes", [295, 24.0, 1.1, 46.3]),
  food("lentils-cooked", "Чечевица (варёная)", "legumes", [116, 9.0, 0.4, 20.1]),
  food("chickpeas-dry", "Нут (сухой)", "legumes", [364, 19.0, 6.0, 61.0]),
  food("chickpeas-cooked", "Нут (варёный)", "legumes", [164, 8.9, 2.6, 27.4]),
  food("beans-canned", "Фасоль красная (консервы)", "legumes", [91, 6.0, 0.5, 15.0], { alias: ["фасоль"] }),
  food("tofu", "Тофу", "legumes", [76, 8.0, 4.8, 1.9]),
  food("mung", "Маш (сухой)", "legumes", [300, 23.9, 1.2, 55.5], { alias: ["бобы мунг"] }),
  food("green-peas", "Горошек зелёный (свежий)", "legumes", [81, 5.4, 0.4, 12.5], { alias: ["горошек", "зелёный горошек"] }),

  /* --- Масла и соусы --- */
  food("sunflower-oil", "Масло подсолнечное", "oils", [884, 0, 99.9, 0], {
    units: [tsp(5), tbsp(17)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(10, "g"), sv(20, "g")],
    default: sv(1, "tbsp"),
    alias: ["масло растительное"],
  }),
  food("olive-oil", "Масло оливковое", "oils", [884, 0, 99.8, 0], {
    units: [tsp(5), tbsp(17)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(10, "g"), sv(20, "g")],
    default: sv(1, "tbsp"),
    alias: ["масло"],
  }),
  food("coconut-oil", "Масло кокосовое", "oils", [862, 0, 99.0, 0], {
    units: [tsp(5), tbsp(14)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(10, "g")],
    default: sv(1, "tbsp"),
    alias: ["масло"],
  }),
  food("margarine", "Маргарин", "oils", [717, 0.3, 80.5, 1.0], {
    units: [tsp(7), tbsp(20)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(20, "g")],
    default: sv(1, "tsp"),
  }),
  food("mayonnaise", "Майонез", "oils", [627, 2.4, 67.0, 3.7], {
    units: [tsp(10), tbsp(20)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(30, "g")],
    default: sv(1, "tbsp"),
  }),
  food("ketchup", "Кетчуп томатный", "oils", [112, 1.2, 1.0, 24.0], {
    units: [tbsp(20)],
    servings: [sv(1, "tbsp"), sv(30, "g"), sv(50, "g")],
    default: sv(1, "tbsp"),
    alias: ["кетчуп", "соус"],
  }),
  food("soy-sauce", "Соевый соус", "oils", [53, 8.1, 0.1, 4.9], {
    units: [tbsp(15)],
    servings: [sv(1, "tbsp"), sv(30, "g")],
    default: sv(1, "tbsp"),
    alias: ["соус"],
  }),
  food("mustard", "Горчица", "oils", [143, 8.2, 6.0, 8.0], {
    units: [tsp(8), tbsp(20)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(30, "g")],
    default: sv(1, "tsp"),
  }),
  food("hummus", "Хумус", "oils", [177, 8.0, 10.0, 14.0], {
    units: [tbsp(25)],
    servings: [sv(1, "tbsp"), sv(50, "g"), sv(100, "g")],
    default: sv(1, "tbsp"),
  }),

  /* --- Напитки --- */
  food("water", "Вода питьевая", "drinks", [0, 0, 0, 0], { ml: true, alias: ["вода"] }),
  food("green-tea", "Чай зелёный (без сахара)", "drinks", [1, 0, 0, 0.2], { ml: true, default: sv(200, "ml") }),
  food("black-tea", "Чай чёрный (без сахара)", "drinks", [1, 0, 0, 0.3], { ml: true, default: sv(200, "ml"), alias: ["чай"] }),
  food("black-coffee", "Кофе чёрный (без сахара)", "drinks", [2, 0.2, 0, 0.3], { ml: true, default: sv(200, "ml"), alias: ["кофе"] }),
  food("cappuccino", "Капучино (без сахара)", "drinks", [30, 2.0, 1.5, 3.0], { ml: true, default: sv(200, "ml"), alias: ["кофе"] }),
  food("latte", "Латте (без сахара)", "drinks", [42, 2.2, 1.8, 4.2], { ml: true, alias: ["кофе"] }),
  food("cocoa", "Какао на молоке (с сахаром)", "drinks", [60, 2.5, 2.0, 8.5], { ml: true, alias: ["какао"] }),
  food("orange-juice", "Сок апельсиновый", "drinks", [45, 0.7, 0.2, 10.4], { ml: true, alias: ["сок"] }),
  food("apple-juice", "Сок яблочный", "drinks", [46, 0.1, 0.1, 11.3], { ml: true, alias: ["сок"] }),
  food("tomato-juice", "Сок томатный", "drinks", [21, 0.7, 0.2, 3.8], { ml: true, alias: ["сок"] }),
  food("kvass", "Квас", "drinks", [27, 0.2, 0, 5.3], { ml: true }),
  food("lemonade", "Лимонад (сладкая газировка)", "drinks", [42, 0, 0, 10.6], { ml: true, alias: ["газировка", "лимонад"] }),
  food("beer", "Пиво светлое", "drinks", [43, 0.5, 0, 3.6], {
    ml: true,
    units: [unit("bottle", "package", "бутылка", 500, "бутылки", "бутылок")],
    servings: [sv(1, "bottle"), sv(330, "ml"), sv(500, "ml"), sv(1000, "ml")],
    default: sv(1, "bottle"),
    alias: ["пиво"],
  }),
  food("red-wine", "Вино красное сухое", "drinks", [68, 0.1, 0, 0.3], {
    ml: true,
    units: [unit("glass", "serving", "бокал", 150, "бокала", "бокалов")],
    servings: [sv(1, "glass"), sv(250, "ml"), sv(500, "ml")],
    default: sv(1, "glass"),
    alias: ["вино"],
  }),
  food("white-wine", "Вино белое сухое", "drinks", [66, 0.1, 0, 0.6], {
    ml: true,
    units: [unit("glass", "serving", "бокал", 150, "бокала", "бокалов")],
    servings: [sv(1, "glass"), sv(250, "ml"), sv(500, "ml")],
    default: sv(1, "glass"),
    alias: ["вино"],
  }),
  food("vodka", "Водка", "drinks", [235, 0, 0, 0], { ml: true, default: sv(50, "ml") }),
  food("cognac", "Коньяк", "drinks", [240, 0, 0, 0.1], { ml: true, default: sv(50, "ml") }),

  /* --- Сладости --- */
  food("milk-chocolate", "Шоколад молочный", "sweets", [535, 7.6, 30.0, 59.5], { servings: [sv(25, "g"), sv(50, "g"), sv(100, "g")], default: sv(25, "g"), alias: ["шоколад"] }),
  food("dark-chocolate", "Шоколад тёмный", "sweets", [546, 7.9, 35.3, 52.4], { servings: [sv(25, "g"), sv(50, "g"), sv(100, "g")], default: sv(25, "g"), alias: ["шоколад горький", "шоколад"] }),
  food("white-chocolate", "Шоколад белый", "sweets", [541, 6.0, 32.0, 57.0], { servings: [sv(25, "g"), sv(50, "g"), sv(100, "g")], default: sv(25, "g"), alias: ["шоколад"] }),
  food("caramel", "Карамель", "sweets", [370, 0.1, 0.1, 96.0], {
    units: [piece(6)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(3, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["конфеты"],
  }),
  food("toffee", "Ирис", "sweets", [387, 3.3, 7.5, 77.0], {
    units: [piece(8)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(3, "piece")],
    default: sv(1, "piece"),
    alias: ["конфеты"],
  }),
  food("marmalade", "Мармелад", "sweets", [321, 0.4, 0.1, 77.7], {
    units: [piece(10)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(3, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("zefir", "Зефир", "sweets", [326, 0.8, 0.1, 80.0], {
    units: [piece(33)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("pastila", "Пастила", "sweets", [324, 0.5, 0.2, 80.8], {
    units: [piece(25)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
  }),
  food("halva", "Халва", "sweets", [523, 11.6, 29.7, 54.5]),
  food("sugar-cookies", "Печенье сахарное", "sweets", [417, 7.5, 9.0, 76.0], {
    units: [piece(10)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(3, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["печенье"],
  }),
  food("oat-cookies", "Печенье овсяное", "sweets", [437, 6.0, 15.0, 70.0], {
    units: [piece(15)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(3, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["печенье"],
  }),
  food("wafers", "Вафли", "sweets", [434, 3.9, 12.0, 74.0]),
  food("pryaniki", "Пряники", "sweets", [336, 5.8, 5.0, 69.0], {
    units: [piece(40)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["пряник"],
  }),
  food("cake", "Торт бисквитный (с кремом)", "sweets", [397, 5.0, 15.0, 62.0], {
    units: [unit("slice", "slice", "кусок", 120, "куска", "кусков")],
    servings: [sv(1, "slice"), sv(100, "g")],
    default: sv(1, "slice"),
    alias: ["торт"],
  }),
  food("ice-cream", "Мороженое сливочное", "sweets", [207, 3.5, 11.0, 24.0], {
    units: [piece(80)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["мороженое", "пломбир"],
  }),
  food("honey", "Мёд", "sweets", [304, 0.3, 0, 82.4], {
    units: [tsp(8), tbsp(25)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(20, "g"), sv(50, "g")],
    default: sv(1, "tsp"),
    alias: ["мед"],
  }),
  food("jam", "Варенье (джем)", "sweets", [271, 0.4, 0.1, 70.9], {
    units: [tsp(10), tbsp(25)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(30, "g")],
    default: sv(1, "tbsp"),
    alias: ["варенье", "джем"],
  }),
  food("sugar", "Сахар", "sweets", [387, 0, 0, 99.8], {
    units: [tsp(5), tbsp(20)],
    servings: [sv(1, "tsp"), sv(1, "tbsp"), sv(50, "g")],
    default: sv(1, "tsp"),
  }),
  food("popcorn", "Попкорн (сладкий)", "sweets", [401, 8.0, 12.0, 65.0]),

  /* --- Готовые продукты --- */
  food("boiled-sausage", "Колбаса варёная", "ready", [257, 13.7, 22.8, 0], {
    units: [slice(20)],
    servings: [sv(1, "slice"), sv(2, "slice"), sv(100, "g")],
    default: sv(1, "slice"),
    alias: ["колбаса"],
  }),
  food("smoked-sausage", "Колбаса сырокопчёная", "ready", [473, 21.0, 42.0, 0], {
    units: [slice(15)],
    servings: [sv(1, "slice"), sv(2, "slice"), sv(100, "g")],
    default: sv(1, "slice"),
    alias: ["колбаса"],
  }),
  food("sausages", "Сосиски молочные", "ready", [266, 11.0, 23.9, 1.6], {
    units: [piece(50)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["сосиски", "сосиска"],
  }),
  food("ham", "Ветчина", "ready", [270, 14.0, 24.0, 0], {
    units: [slice(20)],
    servings: [sv(1, "slice"), sv(2, "slice"), sv(100, "g")],
    default: sv(1, "slice"),
  }),
  food("bacon", "Бекон (сырой)", "ready", [417, 22.0, 35.0, 0], {
    units: [slice(15)],
    servings: [sv(1, "slice"), sv(2, "slice"), sv(100, "g")],
    default: sv(1, "slice"),
  }),
  food("pelmeni", "Пельмени (варёные)", "ready", [245, 11.9, 8.5, 29.4], {
    units: [piece(12)],
    servings: [sv(5, "piece"), sv(10, "piece"), sv(250, "g")],
    default: sv(250, "g"),
    alias: ["пельмени"],
  }),
  food("vareniki", "Вареники с картофелем (варёные)", "ready", [210, 4.5, 4.0, 36.0], {
    units: [piece(25)],
    servings: [sv(5, "piece"), sv(10, "piece"), sv(250, "g")],
    default: sv(250, "g"),
    alias: ["вареники"],
  }),
  food("cutlet", "Котлета (из говядины, жареная)", "ready", [250, 13.0, 20.0, 7.0], {
    units: [piece(75)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["котлета"],
  }),
  food("golubtsy", "Голубцы (готовые)", "ready", [140, 5.0, 7.0, 14.0], {
    units: [unit("serving", "serving", "порция", 250, "порции", "порций")],
    servings: [sv(1, "serving"), sv(100, "g")],
    default: sv(1, "serving"),
    alias: ["голубцы"],
  }),
  food("pilaf", "Плов с курицей", "ready", [190, 7.0, 7.0, 25.0], {
    units: [unit("serving", "serving", "порция", 250, "порции", "порций")],
    servings: [sv(1, "serving"), sv(100, "g")],
    default: sv(1, "serving"),
    alias: ["плов"],
  }),
  food("borscht", "Борщ (готовый)", "ready", [49, 1.5, 2.5, 5.0], {
    units: [unit("serving", "serving", "тарелка", 350, "тарелки", "тарелок")],
    servings: [sv(1, "serving"), sv(100, "g")],
    default: sv(1, "serving"),
    alias: ["борщ", "суп"],
  }),
  food("pizza", "Пицца с сыром", "ready", [266, 11.0, 10.0, 33.0], {
    units: [unit("slice", "slice", "кусок", 100, "куска", "кусков")],
    servings: [sv(1, "slice"), sv(2, "slice"), sv(100, "g")],
    default: sv(1, "slice"),
    alias: ["пицца"],
  }),
  food("shawarma", "Шаурма с курицей", "ready", [200, 12.0, 8.0, 20.0], {
    units: [piece(350)],
    servings: [sv(1, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["шаурма", "шаверма"],
  }),
  food("french-fries", "Картофель фри", "ready", [312, 3.4, 15.0, 41.0], {
    units: [unit("serving", "serving", "порция", 150, "порции", "порций")],
    servings: [sv(1, "serving"), sv(100, "g")],
    default: sv(1, "serving"),
    alias: ["картошка фри", "фри"],
  }),
  food("mashed-potato", "Картофельное пюре (с молоком и маслом)", "ready", [106, 2.0, 4.2, 15.0], {
    units: [unit("serving", "serving", "порция", 200, "порции", "порций")],
    servings: [sv(1, "serving"), sv(100, "g")],
    default: sv(1, "serving"),
    alias: ["пюре"],
  }),
  food("omelette", "Омлет (из яиц с молоком)", "ready", [184, 9.6, 15.4, 2.2], {
    units: [unit("serving", "serving", "порция", 150, "порции", "порций")],
    servings: [sv(1, "serving"), sv(100, "g")],
    default: sv(1, "serving"),
    alias: ["омлет"],
  }),
  food("fried-eggs", "Яичница (жареная)", "ready", [243, 12.0, 20.0, 0.7], {
    units: [unit("serving", "serving", "порция", 120, "порции", "порций")],
    servings: [sv(1, "serving"), sv(100, "g")],
    default: sv(1, "serving"),
    alias: ["яичница", "глазунья"],
  }),
  food("pancakes", "Блины (готовые)", "ready", [189, 5.2, 6.0, 27.0], {
    units: [unit("piece", "piece", "блин", 40, "блина", "блинов")],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["блины", "блинчики"],
  }),
  food("chips", "Чипсы картофельные", "ready", [536, 6.6, 33.0, 53.0], {
    units: [unit("package", "package", "упаковка", 90, "упаковки", "упаковок")],
    servings: [sv(1, "package"), sv(50, "g")],
    default: sv(1, "package"),
    alias: ["чипсы"],
  }),
  food("rolls", "Роллы с лососем", "ready", [190, 7.0, 6.0, 27.0], {
    units: [piece(30)],
    servings: [sv(1, "piece"), sv(4, "piece"), sv(8, "piece"), sv(100, "g")],
    default: sv(4, "piece"),
    alias: ["роллы", "суши"],
  }),
  food("syrniki", "Сырники (жареные)", "ready", [220, 14.0, 9.0, 20.0], {
    units: [piece(60)],
    servings: [sv(1, "piece"), sv(2, "piece"), sv(100, "g")],
    default: sv(1, "piece"),
    alias: ["сырники"],
  }),
];

const foodById = new Map(foods.map((item) => [item.id, item]));

/** Looks up a built-in food. User foods are searched separately. */
export function getFoodById(id: string): GenericFood | undefined {
  return foodById.get(id);
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

export const ALL_CATEGORY = "all" as const;

/**
 * Filters foods by category and a free-text query. The query matches the
 * product name (prefix matches rank higher), aliases and category name.
 */
export function searchFoods(
  list: FoodProduct[],
  query: string,
  categoryId: string = ALL_CATEGORY,
): FoodProduct[] {
  const byCategory =
    categoryId === ALL_CATEGORY
      ? list
      : list.filter((item) => item.category === categoryId);

  const normalized = query.trim().toLowerCase();
  if (!normalized) return byCategory;

  const scored: { item: FoodProduct; score: number }[] = [];
  for (const item of byCategory) {
    const name = item.name.toLowerCase();
    const brand = item.brand?.toLowerCase() ?? "";
    let score: number | null = null;
    if (name.startsWith(normalized)) {
      score = 0;
    } else if (name.includes(normalized) || brand.includes(normalized)) {
      score = 1;
    } else if (
      item.aliases.some((alias) => alias.toLowerCase().includes(normalized))
    ) {
      score = 2;
    } else {
      const category = CATEGORY_BY_ID.get(item.category);
      if (category && category.name.toLowerCase().includes(normalized)) {
        score = 3;
      }
    }
    if (score !== null) scored.push({ item, score });
  }

  scored.sort((a, b) => a.score - b.score);
  return scored.map((entry) => entry.item);
}
