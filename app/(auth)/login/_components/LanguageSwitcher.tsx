import { useState } from "react";
import { TouchableOpacity, Modal } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import * as Haptics from "expo-haptics";

export function LanguageSwitcher() {
  const theme = useTheme();
  const { t, locale, changeLanguage } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const isDark = theme.pageBg === "#0f172a";

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

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  const handleLanguageChange = async (newLocale: "en" | "nl") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await changeLanguage(newLocale);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowModal(true);
        }}
        activeOpacity={0.7}
        className="cursor-pointer"
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: theme.cardBg,
          borderWidth: 1,
          borderColor: theme.cardBorder,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <HStack className="items-center gap-2">
          <Text style={{ fontSize: 18 }}>{currentLanguage.flag}</Text>
          <Text
            className="text-sm font-semibold"
            style={{ color: theme.textPrimary }}
          >
            {currentLanguage.code.toUpperCase()}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
        </HStack>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowModal(false)}
        >
          <Box
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.4 : 0.15,
              shadowRadius: 16,
              elevation: 8,
              width: "80%",
              maxWidth: 300,
            }}
          >
            <VStack className="gap-0">
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
                      style={{
                        paddingVertical: 16,
                        paddingHorizontal: 20,
                        backgroundColor: isSelected
                          ? isDark
                            ? "rgba(99, 102, 241, 0.15)"
                            : "rgba(99, 102, 241, 0.08)"
                          : "transparent",
                      }}
                    >
                      <HStack className="items-center gap-3">
                        <Text style={{ fontSize: 24 }}>{language.flag}</Text>
                        <VStack className="flex-1">
                          <Text
                            className="text-base font-semibold"
                            style={{ color: theme.textPrimary }}
                          >
                            {language.nativeName}
                          </Text>
                          <Text
                            className="text-sm"
                            style={{ color: theme.textSecondary }}
                          >
                            {language.name}
                          </Text>
                        </VStack>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={theme.buttonPrimary}
                          />
                        )}
                      </HStack>
                    </TouchableOpacity>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
