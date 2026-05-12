import { tr } from "./tr";
import { en } from "./en";

export const defaultLocale = "tr" as const;
export const localeCookieName = "shotpot_locale";
export const dictionaries = { tr, en } as const;

export type Locale = keyof typeof dictionaries;
export type AppCopy = (typeof dictionaries)[Locale];

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "tr" || value === "en";
}

export function getCopy(locale: Locale = defaultLocale): AppCopy {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export const copy = getCopy();
