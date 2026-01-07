import { TouchableOpacity, ActivityIndicator } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Ionicons } from "@expo/vector-icons";
import { Church } from "@/types/church";
import { MembershipRequestWithChurch } from "@/types/membership";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface ChurchCardProps {
  church: Church;
  request?: MembershipRequestWithChurch;
  onApply: (params: { churchId: string; message?: string }) => void;
  onCancel: (requestId: string) => void;
  isApplying: boolean;
  isCancelling: boolean;
  hasPendingApplication?: boolean;
  onOpenModal?: (church: Church) => void;
}

export function ChurchCard({
  church,
  request,
  onApply,
  onCancel,
  isApplying,
  isCancelling,
  hasPendingApplication = false,
  onOpenModal,
}: ChurchCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleApplyPress = () => {
    if (onOpenModal) {
      onOpenModal(church);
    } else {
      onApply({ churchId: church.id });
    }
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Box
      className="rounded-xl p-4 mb-3"
      style={{
        backgroundColor: theme.cardBg,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.2 : 0.04,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <VStack className="gap-3">
        <HStack className="items-center gap-3">
          <Box
            className="rounded-lg p-2"
            style={{
              backgroundColor: theme.avatarPrimary,
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="business" size={20} color={isDark ? "#ffffff" : theme.buttonPrimary} />
          </Box>
          <VStack className="flex-1 gap-0.5">
            <Text className="text-base font-semibold" style={{ color: theme.textPrimary }}>
              {church.name}
            </Text>
            <HStack className="items-center gap-2">
              {church.denomination && (
                <>
                  <Text className="text-xs" style={{ color: theme.textSecondary }}>
                    {church.denomination}
                  </Text>
                  {church.location && (
                    <Text className="text-xs" style={{ color: theme.textTertiary }}>
                      •
                    </Text>
                  )}
                </>
              )}
              {church.location && (
                <HStack className="items-center gap-1">
                  <Ionicons name="location-outline" size={12} color={theme.textTertiary} />
                  <Text className="text-xs" style={{ color: theme.textSecondary }}>
                    {church.location}
                  </Text>
                </HStack>
              )}
            </HStack>
          </VStack>
        </HStack>

        {hasPendingApplication ? (
          <Box
            className="rounded-lg px-3 py-2"
            style={{
              backgroundColor: isDark ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.05)",
              borderWidth: 1,
              borderColor: isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.15)",
            }}
          >
            <HStack className="items-center gap-2">
              <Ionicons name="information-circle" size={14} color={theme.buttonPrimary} />
              <Text className="text-xs flex-1" style={{ color: theme.textSecondary }}>
                {t("findChurch.pendingApplicationRequiredDescription")}
              </Text>
            </HStack>
          </Box>
        ) : (
          <Button
            onPress={handleApplyPress}
            action="primary"
            variant="solid"
            size="md"
            className="h-11 cursor-pointer rounded-lg"
            isDisabled={isApplying}
            style={{
              backgroundColor: theme.buttonPrimary,
            }}
          >
            {isApplying ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <ButtonText
                className="text-sm font-semibold"
                style={{ color: "#ffffff" }}
              >
                {t("findChurch.applyToJoin")}
              </ButtonText>
            )}
          </Button>
        )}
      </VStack>
    </Box>
  );
}
