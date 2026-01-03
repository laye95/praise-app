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
import * as Haptics from "expo-haptics";

export default function ChurchInfoScreen() {
  const theme = useTheme();
  const isDark = theme.pageBg === "#0f172a";
  const { t } = useTranslation();

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
                {t("churchInfo.title")}
              </Text>
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                {t("churchInfo.subtitle")}
              </Text>
            </VStack>
          </HStack>

          <VStack className="gap-6">
            <VStack className="gap-3">
              <Text className="text-xs font-semibold uppercase tracking-wider px-4" style={{ color: theme.textTertiary }}>
                {t("churchInfo.churchSettings")}
              </Text>

              <Box
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/(dashboard)/(church)/settings/church-info/general");
                  }}
                  className="cursor-pointer"
                >
                  <HStack className="items-center px-4 py-4">
                    <Box className="mr-3">
                      <Ionicons name="information-circle" size={20} color={isDark ? "#93c5fd" : "#6366f1"} />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                        {t("churchInfo.generalInformation")}
                      </Text>
                      <Text className="text-xs" style={{ color: theme.textSecondary }}>
                        {t("churchInfo.generalInformationSubtitle")}
                      </Text>
                    </VStack>
                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                  </HStack>
                </TouchableOpacity>

                <Box
                  style={{
                    height: 1,
                    backgroundColor: theme.cardBorder,
                    marginHorizontal: 16,
                  }}
                />

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="cursor-pointer"
                  style={{ opacity: 0.5 }}
                >
                  <HStack className="items-center px-4 py-4">
                    <Box className="mr-3">
                      <Ionicons name="images" size={20} color={isDark ? "#fbbf24" : "#d97706"} />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                        {t("churchInfo.mediaLibrary")}
                      </Text>
                      <Text className="text-xs" style={{ color: theme.textSecondary }}>
                        {t("churchInfo.mediaLibrarySubtitle")}
                      </Text>
                    </VStack>
                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    <Box
                      className="ml-2 px-2 py-1 rounded"
                      style={{ backgroundColor: theme.badgeWarning }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: isDark ? "#fbbf24" : "#d97706" }}>
                        Coming Soon
                      </Text>
                    </Box>
                  </HStack>
                </TouchableOpacity>

                <Box
                  style={{
                    height: 1,
                    backgroundColor: theme.cardBorder,
                    marginHorizontal: 16,
                  }}
                />

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="cursor-pointer"
                  style={{ opacity: 0.5 }}
                >
                  <HStack className="items-center px-4 py-4">
                    <Box className="mr-3">
                      <Ionicons name="color-palette" size={20} color={isDark ? "#c084fc" : "#9333ea"} />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                        {t("churchInfo.brandingAppearance")}
                      </Text>
                      <Text className="text-xs" style={{ color: theme.textSecondary }}>
                        {t("churchInfo.brandingAppearanceSubtitle")}
                      </Text>
                    </VStack>
                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    <Box
                      className="ml-2 px-2 py-1 rounded"
                      style={{ backgroundColor: theme.badgeWarning }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: isDark ? "#fbbf24" : "#d97706" }}>
                        Coming Soon
                      </Text>
                    </Box>
                  </HStack>
                </TouchableOpacity>
              </Box>
            </VStack>

            <VStack className="gap-3">
              <Text className="text-xs font-semibold uppercase tracking-wider px-4" style={{ color: theme.textTertiary }}>
                {t("churchInfo.advancedSettings")}
              </Text>

              <Box
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="cursor-pointer"
                  style={{ opacity: 0.5 }}
                >
                  <HStack className="items-center px-4 py-4">
                    <Box className="mr-3">
                      <Ionicons name="notifications" size={20} color={isDark ? "#6ee7b7" : "#059669"} />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                        {t("churchInfo.notifications")}
                      </Text>
                      <Text className="text-xs" style={{ color: theme.textSecondary }}>
                        {t("churchInfo.notificationsSubtitle")}
                      </Text>
                    </VStack>
                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    <Box
                      className="ml-2 px-2 py-1 rounded"
                      style={{ backgroundColor: theme.badgeWarning }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: isDark ? "#fbbf24" : "#d97706" }}>
                        Coming Soon
                      </Text>
                    </Box>
                  </HStack>
                </TouchableOpacity>

                <Box
                  style={{
                    height: 1,
                    backgroundColor: theme.cardBorder,
                    marginHorizontal: 16,
                  }}
                />

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="cursor-pointer"
                  style={{ opacity: 0.5 }}
                >
                  <HStack className="items-center px-4 py-4">
                    <Box className="mr-3">
                      <Ionicons name="settings" size={20} color={isDark ? "#94a3b8" : "#475569"} />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                        {t("churchInfo.integrations")}
                      </Text>
                      <Text className="text-xs" style={{ color: theme.textSecondary }}>
                        {t("churchInfo.integrationsSubtitle")}
                      </Text>
                    </VStack>
                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    <Box
                      className="ml-2 px-2 py-1 rounded"
                      style={{ backgroundColor: theme.badgeWarning }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: isDark ? "#fbbf24" : "#d97706" }}>
                        Coming Soon
                      </Text>
                    </Box>
                  </HStack>
                </TouchableOpacity>
              </Box>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
