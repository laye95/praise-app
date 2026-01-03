import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import nl from "./locales/nl.json";

const i18n = new I18n({
  en,
  nl,
});

i18n.enableFallback = true;
i18n.defaultLocale = "en";

const STORAGE_KEY = "@praise_app:language";

export const getStoredLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error getting stored language:", error);
    return null;
  }
};

export const setStoredLanguage = async (locale: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, locale);
    i18n.locale = locale;
    i18n.defaultLocale = locale;
  } catch (error) {
    console.error("Error storing language:", error);
  }
};

export const initializeI18n = async (): Promise<void> => {
  const storedLanguage = await getStoredLanguage();
  const deviceLanguage = Localization.getLocales()[0]?.languageCode || "en";
  
  const locale = storedLanguage || (deviceLanguage === "nl" ? "nl" : "en");
  i18n.locale = locale;
};

export const getCurrentLanguage = (): string => {
  return i18n.locale;
};

export const setLanguage = async (locale: "en" | "nl"): Promise<void> => {
  await setStoredLanguage(locale);
};

export default i18n;
