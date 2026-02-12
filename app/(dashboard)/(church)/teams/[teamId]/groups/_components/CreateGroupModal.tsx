import { useEffect, useState } from "react";
import { Keyboard } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  BottomSheetDrawerTextInput,
} from "@/components/ui/BottomSheetDrawer";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  isCreating: boolean;
}

export function CreateGroupModal({
  visible,
  onClose,
  onCreate,
  isCreating,
}: CreateGroupModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [name, setName] = useState("");

  useEffect(() => {
    if (!visible) setName("");
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    setName("");
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    await onCreate(name.trim());
    handleClose();
  };

  const canCreate = name.trim().length >= 2 && !isCreating;

  return (
    <DrawerWithLayout
      visible={visible}
      onClose={handleClose}
      title={t("teams.groups.createGroup")}
      subtitle={t("teams.groups.createGroupDescription")}
      snapPoints={["45%"]}
      content={
        <Box className="px-6 pb-4">
          <VStack className="gap-4">
            <VStack className="gap-2">
              <Text
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.textSecondary }}
              >
                {t("teams.groups.groupName")}
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
                  placeholder={t("teams.groups.groupNamePlaceholder")}
                  placeholderTextColor={theme.textTertiary}
                  value={name}
                  onChangeText={setName}
                  editable={!isCreating}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                  style={{
                    color: theme.textPrimary,
                    fontSize: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                />
              </Box>
            </VStack>
          </VStack>
        </Box>
      }
      saveButton={{
        label: t("teams.groups.createGroup"),
        onPress: handleCreate,
        disabled: !canCreate,
        loading: isCreating,
      }}
      cancelButton={{
        label: t("common.cancel"),
        onPress: handleClose,
        disabled: isCreating,
      }}
    />
  );
}
