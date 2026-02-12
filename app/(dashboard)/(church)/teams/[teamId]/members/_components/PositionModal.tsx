import { useState, useEffect } from "react";
import { Keyboard } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";
import {
  BottomSheetDrawerTextInput,
} from "@/components/ui/BottomSheetDrawer";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";

interface PositionModalProps {
  visible: boolean;
  memberName: string;
  currentPosition?: string;
  onClose: () => void;
  onSave: (position?: string) => void;
  isSaving?: boolean;
}

export function PositionModal({
  visible,
  memberName,
  currentPosition,
  onClose,
  onSave,
  isSaving = false,
}: PositionModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [position, setPosition] = useState(currentPosition || "");

  useEffect(() => {
    if (visible) setPosition(currentPosition || "");
  }, [visible, currentPosition]);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    if (isSaving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const trimmedPosition = position.trim();
    onSave(trimmedPosition || undefined);
  };

  const hasChanges = position.trim() !== (currentPosition || "");

  return (
    <DrawerWithLayout
      visible={visible}
      onClose={handleClose}
      title={t("teams.editPosition")}
      subtitle={memberName}
      snapPoints={["45%"]}
      content={
        <VStack className="gap-4 px-6">
            <VStack className="gap-2">
              <Text
                className="text-sm font-medium"
                style={{ color: theme.textSecondary }}
              >
                {t("teams.position")}
              </Text>
              <Box
                className="rounded-xl"
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#ffffff",
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#cbd5e1",
                }}
              >
                <BottomSheetDrawerTextInput
                  placeholder={t("teams.positionPlaceholder")}
                  placeholderTextColor={theme.textTertiary}
                  value={position}
                  onChangeText={setPosition}
                  editable={!isSaving}
                  autoCapitalize="words"
                  style={{
                    color: theme.textPrimary,
                    fontSize: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                />
              </Box>
              <Text
                className="text-xs"
                style={{ color: theme.textTertiary }}
              >
                {t("teams.positionHint")}
              </Text>
            </VStack>
          </VStack>
      }
      saveButton={{
        label: t("common.save"),
        onPress: handleSave,
        disabled: !hasChanges || isSaving,
        loading: isSaving,
      }}
      cancelButton={{
        label: t("common.cancel"),
        onPress: handleClose,
        disabled: isSaving,
      }}
    />
  );
}
