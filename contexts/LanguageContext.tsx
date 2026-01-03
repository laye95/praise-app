import {
  getCurrentLanguage,
  getStoredLanguage,
  initializeI18n,
  setLanguage as setI18nLanguage,
} from "@/i18n";
import { userSettingsService } from "@/services/api/userSettingsService";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "expo-router";
import { useAuth } from "./AuthContext";

interface LanguageContextType {
  locale: "en" | "nl";
  changeLanguage: (locale: "en" | "nl") => Promise<void>;
  isInitialized: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  changeLanguage: async () => {},
  isInitialized: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<"en" | "nl">("en");
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      await initializeI18n();

      if (user?.id) {
        try {
          const dbLanguage = await userSettingsService.getSetting<string>(
            user.id,
            "language",
          );

          if (dbLanguage) {
            await setI18nLanguage(dbLanguage as "en" | "nl");
            setLocale(dbLanguage as "en" | "nl");
          } else {
            const storedLanguage = await getStoredLanguage();
            const currentLang = (storedLanguage || getCurrentLanguage()) as
              | "en"
              | "nl";
            setLocale(currentLang);

            if (storedLanguage) {
              try {
                await userSettingsService.setSetting(
                  user.id,
                  "language",
                  storedLanguage,
                );
              } catch (settingError: any) {
                if (settingError?.requiresLogout || settingError?.code === "USER_RECORD_NOT_FOUND") {
                  console.error("User record not found after retries. Logging out...", settingError);
                  await signOut();
                  router.replace("/(auth)/login");
                  return;
                }
                console.warn("Failed to save language preference (user may not be ready yet):", settingError);
              }
            }
          }
        } catch (error) {
          console.error("Error loading language from database:", error);
          const currentLang = getCurrentLanguage() as "en" | "nl";
          setLocale(currentLang);
        }
      } else {
        const currentLang = getCurrentLanguage() as "en" | "nl";
        setLocale(currentLang);
      }

      setIsInitialized(true);
    };
    init();
  }, [user?.id]);

  const changeLanguage = useCallback(
    async (newLocale: "en" | "nl") => {
      await setI18nLanguage(newLocale);
      setLocale(newLocale);

      if (user?.id) {
        try {
          await userSettingsService.setSetting(user.id, "language", newLocale);
        } catch (error: any) {
          if (error?.requiresLogout || error?.code === "USER_RECORD_NOT_FOUND") {
            console.error("User record not found after retries. Logging out...", error);
            await signOut();
            router.replace("/(auth)/login");
            return;
          }
          console.error("Error saving language to database:", error);
        }
      }
    },
    [user?.id],
  );

  const value = useMemo(
    () => ({
      locale,
      changeLanguage,
      isInitialized,
    }),
    [locale, changeLanguage, isInitialized],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
