# NutriTrack

Трекер питания: калории, белки, жиры и углеводы каждый день.

Приложение работает полностью локально: все данные (дневник питания,
профиль, цели) хранятся в localStorage браузера. Бэкенд и синхронизация
будут подключены на следующих этапах.

## Возможности

- **Онбординг** (`/`) — первый запуск: пол, возраст, рост, вес,
  уровень активности и цель (профиль сохраняется локально).
- **Сегодня** (`/today`) — дашборд дня: кольцевой индикатор калорий,
  белки / жиры / углеводы, приёмы пищи с реальными записями.
- **Добавление еды** — кнопка «Добавить еду» (или «Добавить» в карточке
  приёма пищи): выбор приёма → поиск продукта → количество в граммах →
  живой расчёт КБЖУ → добавление в дневник.
- **Продукты** (`/foods`) — база продуктов с поиском, деталями
  (на 100 г) и кнопкой «Добавить в дневник».
- **История** (`/history`) — обзор недели и статистика по дням
  на основе реальных записей.
- **Настройки** (`/settings`) — профиль, нормы питания и параметры
  приложения; всё сохраняется автоматически, включая тёмную тему.

## Технологии

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [lucide-react](https://lucide.dev) — иконки
- Шрифт Inter (self-hosted через `@fontsource-variable/inter`)
- localStorage — хранение данных (без бэкенда)

## Запуск локально

```bash
npm install
npm run dev
```

Приложение будет доступно по адресу <http://localhost:3000>.

Продакшен-сборка:

```bash
npm run build
npm run start
```

Проверки:

```bash
npx tsc --noEmit   # типы
npm run lint       # ESLint
```

## Хранение данных (localStorage)

| Ключ | Содержимое |
| --- | --- |
| `nutritrack:v1:entries` | `FoodEntry[]` — `{ id, foodId, mealType, amount, date }` |
| `nutritrack:v1:profile` | `{ gender, age, height, weight, activity, goal }` |
| `nutritrack:v1:targets` | `{ calories, protein, fat, carbs }` |
| `nutritrack:v1:units` | `"metric" \| "imperial"` |
| `nutritrack:v1:onboarded` | `"true"` после завершения онбординга |
| `nutritrack-theme` | `"light" \| "dark"` (тема) |

Пищевая ценность не дублируется в записях — она вычисляется из
локальной базы продуктов (`src/lib/food-data.ts`) по формуле
`значение на 100 г × количество / 100`.

## Структура проекта

```
src/
├── app/                     # Маршруты (App Router)
│   ├── layout.tsx           # Корневой layout: шрифт, тема, метаданные
│   ├── page.tsx             # Онбординг (первый запуск)
│   └── (app)/               # Группа экранов с навигацией
│       ├── layout.tsx       # Оболочка + DiaryProvider (состояние дневника)
│       ├── today/           # «Сегодня»
│       ├── foods/           # «Продукты»
│       ├── history/         # «История»
│       └── settings/        # «Настройки»
├── components/
│   ├── dashboard/           # Dashboard, CalorieRing, NutritionCard, MealCard
│   ├── nutrition/           # AddFoodModal, FoodSearch, FoodQuantity,
│   │                        # MealFoodList, DailyNutrition
│   ├── foods/               # FoodCard, FoodDetailsModal, FoodsExplorer
│   ├── history/             # HistoryView, WeeklyOverview, HistoryDayCard
│   ├── navigation/          # Navigation, Sidebar, MobileNavigation
│   ├── onboarding/          # OnboardingForm (визард первого запуска)
│   ├── settings/            # SettingsForm, SettingsSection, SettingRow, ThemeToggle
│   └── ui/                  # Card, Button, Input, Modal, Toast, ProgressBar...
└── lib/
    ├── types.ts             # TypeScript-типы (FoodEntry, UserProfile и др.)
    ├── food-data.ts         # Локальная база продуктов (на 100 г)
    ├── app-data.ts          # Приёмы пищи, варианты онбординга, дефолты
    ├── nutrition.ts         # Расчёт КБЖУ и выборки записей
    ├── dates.ts             # Работа с датами и русское форматирование
    ├── storage.ts           # Слой persistence над localStorage
    ├── diary.tsx            # DiaryProvider + useDiary (общее состояние)
    ├── format.ts            # Русское форматирование чисел и склонения
    └── cn.ts                # Утилита для классов
```
