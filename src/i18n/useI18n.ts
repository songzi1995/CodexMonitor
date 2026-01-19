import { useContext } from "react";
import { useI18nContext } from "./I18nProvider";

export function useI18n() {
  const ctx = useContext(useI18nContext());
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
