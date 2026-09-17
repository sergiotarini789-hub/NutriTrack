/**
 * Time-aware greetings for the launch experience and the Today
 * screen. Based on the user's local device time.
 */

export interface TimeGreeting {
  /** e.g. "Доброе утро" */
  text: string;
  /** 👋 for day hours, 🌙 for late night. */
  emoji: string;
}

/** Morning / day / evening / night greeting from the local time. */
export function timeGreeting(date: Date = new Date()): TimeGreeting {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return { text: "Доброе утро", emoji: "👋" };
  if (hour >= 12 && hour < 18) return { text: "Добрый день", emoji: "👋" };
  if (hour >= 18 && hour < 23) return { text: "Добрый вечер", emoji: "👋" };
  return { text: "Доброй ночи", emoji: "🌙" };
}

/**
 * Launch greeting: personal when a name is configured, neutral
 * otherwise ("Добро пожаловать в NutriTrack").
 */
export function launchGreeting(name?: string | null): string {
  const greeting = timeGreeting();
  return name ? `${greeting.text}, ${name} ${greeting.emoji}` : "Добро пожаловать в NutriTrack";
}

/** Short Today-screen greeting ("Доброе утро" or "Доброе утро, Игорь"). */
export function todayGreeting(name?: string | null): string {
  const greeting = timeGreeting();
  return name ? `${greeting.text}, ${name}` : greeting.text;
}

/**
 * Short contextual phrases for the launch screen. Rotated randomly
 * so the sequence does not repeat; calm, never aggressive.
 */
const LAUNCH_PHRASES = [
  "Станем сегодня лучше.",
  "Новый день — новый старт.",
  "Твой день начинается здесь.",
  "Маленькие шаги. Большой результат.",
  "Спокойный темп — лучший темп.",
] as const;

export function launchPhrase(): string {
  return LAUNCH_PHRASES[Math.floor(Math.random() * LAUNCH_PHRASES.length)];
}
