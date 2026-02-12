import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { TeamGroupMemberRole, TeamGroupMemberWithUser } from "@/types/team";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";

interface GroupMemberRoleModalProps {
  visible: boolean;
  member: TeamGroupMemberWithUser | null;
  currentRole: TeamGroupMemberRole;
  canChangeLeadership?: boolean;
  onClose: () => void;
  onUpdateRole: (role: TeamGroupMemberRole) => void;
  isUpdating: boolean;
}

export function GroupMemberRoleModal({
  visible,
  member,
  currentRole,
  canChangeLeadership = false,
  onClose,
  onUpdateRole,
  isUpdating,
}: GroupMemberRoleModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [selectedRole, setSelectedRole] = useState<TeamGroupMemberRole>(currentRole);

  useEffect(() => {
    if (visible) setSelectedRole(currentRole);
  }, [visible, currentRole]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    if (selectedRole !== currentRole && !isUpdating) {
      if (selectedRole === "leader" && !canChangeLeadership) {
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onUpdateRole(selectedRole);
      handleClose();
    }
  };

  const getInitials = (name?: string, email?: string): string => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  if (!member) return null;

  const initials = getInitials(member.user.full_name, member.user.email);
  const displayName =
    member.user.full_name || member.user.email.split("@")[0];
  const hasChanges = selectedRole !== currentRole;
  const canSave = hasChanges && (selectedRole === "member" || canChangeLeadership);

  return (
    <DrawerWithLayout
      visible={visible && !!member}
      onClose={handleClose}
      title={t("teams.groups.changeRole")}
      subtitle={t("teams.groups.changeRoleDescription", { name: displayName })}
      snapPoints={["55%"]}
      content={
        <Box className="px-6 pb-4">
          <HStack className="items-center gap-3 mb-4">
            <Box
              className="rounded-xl"
              style={{
                width: 48,
                height: 48,
                backgroundColor: theme.avatarPrimary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: isDark ? "#ffffff" : theme.buttonPrimary }}
              >
                {initials}
              </Text>
            </Box>
            <VStack className="flex-1 gap-0.5">
              <Text
                className="text-base font-semibold"
                style={{ color: theme.textPrimary }}
              >
                {displayName}
              </Text>
              {member.user.full_name && (
                <Text
                  className="text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  {member.user.email}
                </Text>
              )}
            </VStack>
          </HStack>

          <VStack className="gap-2">
            <Text
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: theme.textSecondary }}
            >
              {t("teams.groups.role")}
            </Text>
            <VStack className="gap-2">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  if (canChangeLeadership) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedRole("leader");
                  }
                }}
                disabled={!canChangeLeadership}
                className="cursor-pointer"
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor:
                    selectedRole === "leader"
                      ? theme.buttonPrimary
                      : isDark
                        ? "#1e293b"
                        : "#ffffff",
                  borderWidth: 1,
                  borderColor:
                    selectedRole === "leader"
                      ? theme.buttonPrimary
                      : theme.cardBorder,
                  opacity: canChangeLeadership ? 1 : 0.5,
                }}
              >
                <HStack className="items-center justify-between">
                  <HStack className="items-center gap-3">
                    <Box
                      className="rounded-lg px-2 py-1"
                      style={{
                        backgroundColor:
                          selectedRole === "leader"
                            ? "rgba(255, 255, 255, 0.2)"
                            : theme.badgeWarning,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color:
                            selectedRole === "leader"
                              ? "#ffffff"
                              : isDark
                                ? "#ffffff"
                                : "#92400e",
                        }}
                      >
                        {t("teams.groups.leader")}
                      </Text>
                    </Box>
                    <VStack className="gap-0.5">
                      <Text
                        className="text-sm"
                        style={{
                          color:
                            selectedRole === "leader"
                              ? "#ffffff"
                              : theme.textPrimary,
                        }}
                      >
                        {t("teams.groups.leaderDescription")}
                      </Text>
                      {!canChangeLeadership && (
                        <Text
                          className="text-xs"
                          style={{
                            color:
                              selectedRole === "leader"
                                ? "rgba(255, 255, 255, 0.7)"
                                : theme.textSecondary,
                          }}
                        >
                          {t("teams.groups.adminOnly")}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                  {selectedRole === "leader" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#ffffff"
                    />
                  )}
                </HStack>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedRole("member");
                }}
                className="cursor-pointer"
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor:
                    selectedRole === "member"
                      ? theme.buttonPrimary
                      : isDark
                        ? "#1e293b"
                        : "#ffffff",
                  borderWidth: 1,
                  borderColor:
                    selectedRole === "member"
                      ? theme.buttonPrimary
                      : theme.cardBorder,
                }}
              >
                <HStack className="items-center justify-between">
                  <HStack className="items-center gap-3">
                    <Box
                      className="rounded-lg px-2 py-1"
                      style={{
                        backgroundColor:
                          selectedRole === "member"
                            ? "rgba(255, 255, 255, 0.2)"
                            : theme.badgeInfo,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{
                          color:
                            selectedRole === "member"
                              ? "#ffffff"
                              : isDark
                                ? "#ffffff"
                                : "#2563eb",
                        }}
                      >
                        {t("teams.member")}
                      </Text>
                    </Box>
                    <Text
                      className="text-sm"
                      style={{
                        color:
                          selectedRole === "member"
                            ? "#ffffff"
                            : theme.textPrimary,
                      }}
                    >
                      {t("teams.groups.memberDescription")}
                    </Text>
                  </HStack>
                  {selectedRole === "member" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#ffffff"
                    />
                  )}
                </HStack>
              </TouchableOpacity>
            </VStack>
          </VStack>
        </Box>
      }
      saveButton={{
        label: t("teams.groups.saveRole"),
        onPress: handleSave,
        disabled: !canSave || isUpdating,
        loading: isUpdating,
      }}
      cancelButton={{
        label: t("common.cancel"),
        onPress: handleClose,
        disabled: isUpdating,
      }}
    />
  );
}
