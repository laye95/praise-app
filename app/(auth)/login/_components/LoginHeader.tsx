import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons } from "@expo/vector-icons";

export function LoginHeader() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <VStack className="mb-10 items-center">
      <Box
        className="mb-6 rounded-3xl p-5"
        style={{
          backgroundColor: theme.avatarPrimary,
          width: 80,
          height: 80,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="people" size={40} color={theme.buttonPrimary} />
      </Box>
      <VStack className="items-center gap-3">
        <Heading className="text-center text-4xl font-bold" style={{ color: theme.textPrimary }}>
          {t("auth.welcomeBack")}
        </Heading>
        <Text
          className="max-w-xs text-center text-base"
          style={{ color: theme.textSecondary, lineHeight: 22 }}
        >
          {t("auth.signInSubtitle")}
        </Text>
      </VStack>
    </VStack>
  );
}
