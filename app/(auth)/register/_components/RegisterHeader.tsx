import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

export function RegisterHeader() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <VStack className="mb-10 w-full items-center">
      <Heading className="text-center text-5xl font-extrabold" style={{ color: theme.textPrimary }}>
        {t("auth.getStarted")}
      </Heading>
      <Text
        className="max-w-sm text-center text-base mt-2"
        style={{ color: theme.textSecondary, lineHeight: 24 }}
      >
        {t("auth.registerSubtitle")}
      </Text>
    </VStack>
  );
}
