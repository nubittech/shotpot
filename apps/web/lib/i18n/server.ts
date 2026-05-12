import { cookies } from "next/headers";
import { defaultLocale, getCopy, isLocale, localeCookieName, type Locale } from ".";

export function getServerLocale(): Locale {
  const value = cookies().get(localeCookieName)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export function getServerCopy() {
  return getCopy(getServerLocale());
}
