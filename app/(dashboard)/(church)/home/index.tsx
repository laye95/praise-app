import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

export default function HomeScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <ScrollView className="flex-1">
        <Box className="px-6 py-4">
          <VStack className="gap-6">
            <VStack className="gap-2">
              <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
                {t("home.welcomeBack")}
              </Text>
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                {user?.email}
              </Text>
            </VStack>

            <Box
              className="rounded-2xl p-6"
              style={{
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <HStack className="items-center gap-4">
                <Box className="rounded-full p-4" style={{ backgroundColor: theme.badgeSuccess }}>
                  <Ionicons name="checkmark-circle" size={32} color={theme.buttonAccept} />
                </Box>
                <VStack className="flex-1 gap-1">
                  <Text className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                    {t("home.churchDashboard")}
                  </Text>
                  <Text className="text-sm" style={{ color: theme.textSecondary }}>
                    {t("home.churchCommunity")}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box
              className="rounded-2xl border-l-4 p-5"
              style={{
                backgroundColor: theme.badgeInfo,
                borderLeftColor: theme.buttonPrimary,
              }}
            >
              <HStack className="items-start gap-3">
                <Ionicons name="information-circle" size={22} color={theme.buttonPrimary} />
                <VStack className="flex-1 gap-1">
                  <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                    {t("home.moreFeaturesComing")}
                  </Text>
                  <Text className="text-xs" style={{ color: theme.textSecondary }}>
                    {t("home.featuresDescription")}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
