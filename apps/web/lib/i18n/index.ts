import { tr } from "./tr";

export const defaultLocale = "tr" as const;
export const dictionaries = { tr } as const;

export type Locale = keyof typeof dictionaries;
export type AppCopy = (typeof dictionaries)[Locale];

export function getCopy(locale: Locale = defaultLocale): AppCopy {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export const copy = getCopy();
