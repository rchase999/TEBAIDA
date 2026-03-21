// Simple i18n system for DebateForge
// Supports string interpolation: t('greeting', { name: 'John' }) => "Hello, John!"

type Locale = 'en' | 'es' | 'fr' | 'de' | 'ja';
type TranslationKey = string;
type Translations = Record<TranslationKey, string>;

const translations: Record<Locale, Translations> = {} as Record<Locale, Translations>;
let currentLocale: Locale = 'en';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  // Notify listeners
  listeners.forEach(fn => fn(locale));
}

export function getLocale(): Locale {
  return currentLocale;
}

export function registerTranslations(locale: Locale, trans: Translations): void {
  translations[locale] = { ...translations[locale], ...trans };
}

export function t(key: string, params?: Record<string, string | number>): string {
  const translation = translations[currentLocale]?.[key] || translations['en']?.[key] || key;
  if (!params) return translation;
  return Object.entries(params).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    translation
  );
}

const listeners: Set<(locale: Locale) => void> = new Set();

export function onLocaleChange(fn: (locale: Locale) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const SUPPORTED_LOCALES: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

export type { Locale };
