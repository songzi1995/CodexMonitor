import { createContext, useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import en from "./translations/en.json";
import zhCN from "./translations/zh-CN.json";

export type Locale = "en" | "zh-CN";
interface MessageMap {
  [key: string]: MessageValue;
}
type MessageValue = string | MessageMap;
type Messages = Record<string, MessageValue>;
type MessageParams = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: MessageParams) => string;
};

const STORAGE_KEY = "codexmonitor.locale";
const FALLBACK_LOCALE: Locale = "en";
const MESSAGES: Record<Locale, Messages> = {
  en: en as Messages,
  "zh-CN": zhCN as Messages,
};
const missingKeys = new Set<string>();

function resolveMessage(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let cursor: MessageValue | undefined = messages;
  for (const part of parts) {
    if (!cursor || typeof cursor !== "object") {
      return undefined;
    }
    cursor = (cursor as Messages)[part];
  }
  return typeof cursor === "string" ? cursor : undefined;
}

function formatMessage(template: string, vars?: MessageParams): string {
  if (!vars) {
    return template;
  }
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, name) => {
    const value = vars[name];
    return value === undefined || value === null ? `{{${name}}}` : String(value);
  });
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "zh-CN") {
    return stored;
  }
  const browser = window.navigator.language.toLowerCase();
  return browser.startsWith("zh") ? "zh-CN" : "en";
}

function translate(locale: Locale, key: string, vars?: MessageParams): string {
  const message = resolveMessage(MESSAGES[locale], key);
  if (message) {
    return formatMessage(message, vars);
  }
  const fallback = resolveMessage(MESSAGES[FALLBACK_LOCALE], key);
  if (fallback) {
    if (import.meta.env.DEV && !missingKeys.has(key)) {
      missingKeys.add(key);
      console.warn(`[i18n] missing ${locale} key: ${key}`);
    }
    return formatMessage(fallback, vars);
  }
  if (import.meta.env.DEV && !missingKeys.has(key)) {
    missingKeys.add(key);
    console.warn(`[i18n] missing key: ${key}`);
  }
  return key;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18nContext() {
  return I18nContext;
}
