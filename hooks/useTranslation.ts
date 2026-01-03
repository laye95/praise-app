import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import i18n from "@/i18n";

export function useTranslation() {
  const { locale, changeLanguage, isInitialized } = useLanguage();

  const t = useMemo(
    () => {
      i18n.locale = locale;
      return (key: string, params?: Record<string, string | number>) => {
        return i18n.t(key, params);
      };
    },
    [locale]
  );

  return {
    t,
    locale,
    changeLanguage,
    isInitialized,
  };
}
