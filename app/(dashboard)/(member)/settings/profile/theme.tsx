import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemePreference } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";

type ThemeOption = "light" | "dark" | "system";

export default function ThemeScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();
  const { themePreference, setThemePreference } = useThemePreference();

  const themeOptions: { value: ThemeOption; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
    {
      value: "light",
      label: t("profile.theme.light"),
      icon: "sunny",
      description: t("profile.theme.lightDescription"),
    },
    {
      value: "dark",
      label: t("profile.theme.dark"),
      icon: "moon",
      description: t("profile.theme.darkDescription"),
    },
    {
      value: "system",
      label: t("profile.theme.system"),
      icon: "phone-portrait",
      description: t("profile.theme.systemDescription"),
    },
  ];

  const handleSelectTheme = async (value: ThemeOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setThemePreference(value);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <ScrollView className="flex-1">
        <Box className="px-6 py-4">
          <HStack className="items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="mr-4 cursor-pointer"
            >
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <VStack className="flex-1">
              <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
                {t("profile.appearance")}
              </Text>
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                {t("profile.appearanceSubtitle")}
              </Text>
            </VStack>
          </HStack>

          <VStack className="gap-3">
            <Text className="text-xs font-semibold uppercase tracking-wider px-4" style={{ color: theme.textTertiary }}>
              {t("profile.theme.title")}
            </Text>

            <Box
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              {themeOptions.map((option, index) => {
                const isSelected = themePreference === option.value;
                const isLast = index === themeOptions.length - 1;

                return (
                  <Box key={option.value}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSelectTheme(option.value)}
                      className="cursor-pointer"
                      style={{
                        borderBottomWidth: isLast ? 0 : 1,
                        borderBottomColor: theme.cardBorder,
                      }}
                    >
                      <HStack className="items-center px-4 py-4">
                        <Box
                          className="mr-3 rounded-xl p-2.5"
                          style={{
                            backgroundColor: isSelected
                              ? theme.buttonPrimary
                              : theme.avatarPrimary,
                          }}
                        >
                          <Ionicons
                            name={option.icon}
                            size={20}
                            color={isSelected ? "#ffffff" : (isDark ? "#ffffff" : theme.buttonPrimary)}
                          />
                        </Box>
                        <VStack className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                            {option.label}
                          </Text>
                          <Text className="text-xs" style={{ color: theme.textSecondary }}>
                            {option.description}
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
