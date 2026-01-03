import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

type RegistrationType = "church" | "member" | null;

interface RegistrationTypeSelectorProps {
  onSelect: (type: RegistrationType) => void;
}

export function RegistrationTypeSelector({ onSelect }: RegistrationTypeSelectorProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <VStack className="gap-6">
      <Text className="text-center text-base mb-2 font-medium" style={{ color: theme.textSecondary }}>
        {t("auth.chooseRegistrationType")}
      </Text>

      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <TouchableOpacity
          onPress={() => onSelect("church")}
          activeOpacity={0.9}
          className="cursor-pointer"
        >
          <Box
            className="rounded-2xl p-6"
            style={{
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <Box className="flex-row items-center justify-between">
              <Box className="flex-row items-center gap-5 flex-1">
                <Box className="rounded-xl p-3" style={{ backgroundColor: theme.avatarPrimary }}>
                  <Ionicons name="business" size={32} color={theme.buttonPrimary} />
                </Box>
                <VStack className="flex-1 gap-1.5">
                  <Text className="font-bold text-lg" style={{ color: theme.textPrimary }}>
                    {t("auth.createChurchTitle")}
                  </Text>
                  <Text className="text-sm" style={{ color: theme.textSecondary }}>
                    {t("auth.createChurchSubtitle")}
                  </Text>
                </VStack>
              </Box>
              <Ionicons name="chevron-forward" size={24} color={theme.buttonPrimary} />
            </Box>
          </Box>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <TouchableOpacity
          onPress={() => onSelect("member")}
          activeOpacity={0.9}
          className="cursor-pointer"
        >
          <Box
            className="rounded-2xl p-6"
            style={{
              backgroundColor: theme.cardBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <Box className="flex-row items-center justify-between">
              <Box className="flex-row items-center gap-5 flex-1">
                <Box className="rounded-xl p-3" style={{ backgroundColor: theme.badgeSuccess }}>
                  <Ionicons name="people" size={32} color={theme.buttonAccept} />
                </Box>
                <VStack className="flex-1 gap-1.5">
                  <Text className="font-bold text-lg" style={{ color: theme.textPrimary }}>
                    {t("auth.joinAsMember")}
                  </Text>
                  <Text className="text-sm" style={{ color: theme.textSecondary }}>
                    {t("auth.joinAsMemberSubtitle")}
                  </Text>
                </VStack>
              </Box>
              <Ionicons name="chevron-forward" size={24} color={theme.buttonAccept} />
            </Box>
          </Box>
        </TouchableOpacity>
      </Animated.View>
    </VStack>
  );
}
