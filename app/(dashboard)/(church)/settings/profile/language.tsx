import { ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";
import * as Haptics from "expo-haptics";

export default function LanguageScreen() {
  const theme = useTheme();
  const isDark = theme.pageBg === "#0f172a";
  const { t, locale, changeLanguage } = useTranslation();

  const handleLanguageChange = async (newLocale: "en" | "nl") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await changeLanguage(newLocale);
  };

  const languages = [
    {
      code: "en" as const,
      name: "English",
      nativeName: "English",
      flag: "🇬🇧",
    },
    {
      code: "nl" as const,
      name: "Dutch",
      nativeName: "Nederlands",
      flag: "🇳🇱",
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="px-6 py-6">
          <HStack className="items-center mb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="mr-4 cursor-pointer"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.cardBg,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <VStack className="flex-1">
              <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
                {t("profile.language")}
              </Text>
              <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                {t("profile.languageSubtitle")}
              </Text>
            </VStack>
          </HStack>

          <VStack className="gap-4">
            <Box
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              {languages.map((language, index) => {
                const isSelected = locale === language.code;
                return (
                  <Box key={language.code}>
                    {index > 0 && (
                      <Box
                        style={{
                          height: 1,
                          backgroundColor: theme.cardBorder,
                          marginHorizontal: 16,
                        }}
                      />
                    )}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleLanguageChange(language.code)}
                      className="cursor-pointer"
                    >
                      <HStack className="items-center px-4 py-4">
                        <Text style={{ fontSize: 24, marginRight: 12 }}>
                          {language.flag}
                        </Text>
                        <VStack className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                            {language.nativeName}
                          </Text>
                          <Text className="text-xs" style={{ color: theme.textSecondary }}>
                            {language.name}
                          </Text>
                        </VStack>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={24} color={theme.buttonPrimary} />
                        )}
                      </HStack>
                    </TouchableOpacity>
                  </Box>
                );
              })}
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
