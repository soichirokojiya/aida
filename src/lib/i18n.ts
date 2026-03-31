export const locales = ["ja", "en", "zh-TW", "th"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ja";

export function isValidLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<Locale, Record<string, any>>();

export async function getMessages(locale: Locale) {
  if (cache.has(locale)) return cache.get(locale)!;
  const msgs = (await import(`../../messages/${locale}.json`)).default;
  cache.set(locale, msgs);
  return msgs;
}

/** Nested key access: t(messages, "hero.title") */
export function t(messages: Record<string, unknown>, key: string): string {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return key;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : key;
}
