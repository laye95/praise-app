import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Church } from "@/types/church";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Keyboard } from "react-native";
import {
  BottomSheetDrawerTextInput,
} from "@/components/ui/BottomSheetDrawer";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";

interface ApplicationModalProps {
  visible: boolean;
  church: Church | null;
  onClose: () => void;
  onSubmit: (message: string) => void;
  isSubmitting: boolean;
}

export function ApplicationModal({
  visible,
  church,
  onClose,
  onSubmit,
  isSubmitting,
}: ApplicationModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!visible) setMessage("");
  }, [visible]);

  const handleSubmit = () => {
    if (!message.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(message.trim());
    setMessage("");
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setMessage("");
    onClose();
  };

  return (
    <DrawerWithLayout
      visible={visible && !!church}
      onClose={handleClose}
      title={t("findChurch.applyToJoin")}
      subtitle={church?.name ?? ""}
      snapPoints={["50%"]}
      content={
        <VStack className="gap-6 px-6">
          <VStack className="gap-3">
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.textPrimary }}
            >
              {t("findChurch.whyJoin")}
            </Text>
            <Text
              className="text-xs"
              style={{ color: theme.textSecondary }}
            >
              {t("findChurch.whyJoinSubtitle")}
            </Text>
            <Box
              className="rounded-xl"
              style={{
                backgroundColor: theme.emptyBg,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                minHeight: 120,
              }}
            >
              <BottomSheetDrawerTextInput
                value={message}
                onChangeText={setMessage}
                placeholder={t("findChurch.messagePlaceholder")}
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{
                  padding: 16,
                  fontSize: 15,
                  color: theme.textPrimary,
                  minHeight: 120,
                }}
                editable={!isSubmitting}
              />
            </Box>
          </VStack>
        </VStack>
      }
      saveButton={{
        label: t("findChurch.submitApplication"),
        onPress: handleSubmit,
        disabled: isSubmitting || !message.trim(),
        loading: isSubmitting,
      }}
      cancelButton={{
        label: t("common.cancel"),
        onPress: handleClose,
        disabled: isSubmitting,
      }}
    />
  );
}
