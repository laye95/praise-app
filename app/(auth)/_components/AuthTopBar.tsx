import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "../login/_components/LanguageSwitcher";

interface AuthTopBarProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export function AuthTopBar({ showBackButton, onBack }: AuthTopBarProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box
      className="w-full px-6 py-4"
      style={{
        backgroundColor: theme.pageBg,
      }}
    >
      <HStack className="items-center justify-between">
        {showBackButton && onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            className="cursor-pointer"
          >
            <HStack className="items-center gap-2">
              <Ionicons name="arrow-back" size={22} color={theme.buttonPrimary} />
              <Text className="text-sm font-semibold" style={{ color: theme.buttonPrimary }}>
                {t("auth.back")}
              </Text>
            </HStack>
          </TouchableOpacity>
        ) : (
          <Box />
        )}
        <LanguageSwitcher />
      </HStack>
    </Box>
  );
}
