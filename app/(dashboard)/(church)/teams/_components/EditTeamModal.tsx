import { BottomSheetDrawerTextInput } from "@/components/ui/BottomSheetDrawer";
import { Box } from "@/components/ui/box";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { UpdateTeamData } from "@/types/team";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

interface EditTeamModalProps {
  visible: boolean;
  teamName: string;
  teamDescription?: string;
  onClose: () => void;
  onSave: (data: UpdateTeamData) => Promise<void>;
  isSaving: boolean;
}

export function EditTeamModal({
  visible,
  teamName,
  teamDescription,
  onClose,
  onSave,
  isSaving,
}: EditTeamModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const [name, setName] = useState(teamName);
  const [description, setDescription] = useState(teamDescription || "");

  useEffect(() => {
    if (visible) {
      setName(teamName);
      setDescription(teamDescription || "");
    }
  }, [visible, teamName, teamDescription]);

  const handleClose = () => {
    Keyboard.dismiss();
    setName(teamName);
    setDescription(teamDescription || "");
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    handleClose();
  };

  const canSave =
    name.trim().length >= 2 &&
    (name.trim() !== teamName ||
      description.trim() !== (teamDescription || "")) &&
    !isSaving;

  return (
    <DrawerWithLayout
      visible={visible}
      onClose={handleClose}
      title={t("teams.editTeam")}
      subtitle={t("teams.editTeamDescription")}
      snapPoints={["55%"]}
      content={
        <VStack className="gap-6 px-6 pb-4">
          <VStack className="gap-3">
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.textPrimary }}
            >
              {t("teams.teamName")}
            </Text>
            <Box
              className="rounded-xl"
              style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#e2e8f0",
              }}
            >
              <BottomSheetDrawerTextInput
                placeholder={t("teams.teamNamePlaceholder")}
                placeholderTextColor={theme.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!isSaving}
                style={{
                  color: theme.textPrimary,
                  fontSize: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              />
            </Box>
          </VStack>

          <VStack className="gap-3">
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.textPrimary }}
            >
              {t("teams.description")}
              <Text
                className="text-xs font-normal"
                style={{ color: theme.textSecondary }}
              >
                {" "}
                ({t("common.optional")})
              </Text>
            </Text>
            <Box
              className="rounded-xl"
              style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#e2e8f0",
              }}
            >
              <BottomSheetDrawerTextInput
                placeholder={t("teams.descriptionPlaceholder")}
                placeholderTextColor={theme.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                editable={!isSaving}
                textAlignVertical="top"
                style={{
                  color: theme.textPrimary,
                  fontSize: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  minHeight: 90,
                  lineHeight: 22,
                }}
              />
            </Box>
          </VStack>
        </VStack>
      }
      saveButton={{
        label: t("common.save"),
        onPress: handleSave,
        disabled: !canSave,
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
