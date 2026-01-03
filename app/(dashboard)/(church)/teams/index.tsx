import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

export default function TeamsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <ScrollView className="flex-1">
        <Box className="px-6 py-4">
          <VStack className="gap-6">
            <VStack className="gap-2">
              <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
                {t("teams.title")}
              </Text>
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                {t("teams.subtitle")}
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
                  <Ionicons name="grid" size={32} color={theme.buttonAccept} />
                </Box>
                <VStack className="flex-1 gap-1">
                  <Text className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                    {t("teams.comingSoon")}
                  </Text>
                  <Text className="text-sm" style={{ color: theme.textSecondary }}>
                    {t("teams.comingSoonDescription")}
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
