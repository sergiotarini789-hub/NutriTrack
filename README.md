# NutriTrack

Трекер питания: калории, белки, жиры и углеводы каждый день.

Этот репозиторий содержит **frontend-основу и визуальный MVP** приложения:
все экраны работают на локальных (mock) данных, бизнес-логика будет
подключена на следующих этапах.

## Экраны

- **Онбординг** (`/`) — первый запуск: пол, возраст, рост, вес,
  уровень активности и цель.
- **Сегодня** (`/today`) — дашборд дня: калории (кольцевой индикатор),
  белки / жиры / углеводы, приёмы пищи и кнопка «Добавить еду».
- **Продукты** (`/foods`) — база продуктов с поиском и пищевой
  ценностью на 100 г.
- **История** (`/history`) — обзор недели и статистика по дням.
- **Настройки** (`/settings`) — профиль, нормы питания и параметры
  приложения (включая тёмную тему).

## Технологии

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [lucide-react](https://lucide.dev) — иконки
- Шрифт Inter (self-hosted через `@fontsource-variable/inter`)

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

## Структура проекта

```
src/
├── app/                     # Маршруты (App Router)
│   ├── layout.tsx           # Корневой layout: шрифт, тема, метаданные
│   ├── page.tsx             # Онбординг (первый запуск)
│   └── (app)/               # Группа экранов с навигацией
│       ├── layout.tsx       # Оболочка: сайдбар + нижняя навигация
│       ├── today/           # «Сегодня»
│       ├── foods/           # «Продукты»
│       ├── history/         # «История»
│       └── settings/        # «Настройки»
├── components/
│   ├── dashboard/           # Дашборд: CalorieRing, NutritionCard, MealCard
│   ├── foods/               # FoodCard, FoodsExplorer (поиск)
│   ├── history/             # WeeklyOverview, HistoryDayCard
│   ├── navigation/          # Navigation, Sidebar, MobileNavigation
│   ├── onboarding/          # OnboardingForm (визард первого запуска)
│   ├── settings/            # SettingsSection, SettingRow, ThemeToggle
│   └── ui/                  # Базовые компоненты: Card, Button, Input, ProgressBar...
└── lib/
    ├── types.ts             # TypeScript-типы
    ├── mock-data.ts         # Локальные (mock) данные
    ├── format.ts            # Русское форматирование чисел и склонения
    └── cn.ts                # Утилита для классов
```
