import {
  BottomSheetDrawerTextInput,
} from "@/components/ui/BottomSheetDrawer";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { teamMemberService } from "@/services/api/teamMemberService";
import { TeamGroupMemberRole, TeamMemberWithUser } from "@/types/team";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, TouchableOpacity } from "react-native";

interface AddGroupMemberModalProps {
  visible: boolean;
  teamId: string;
  groupId: string;
  groupName: string;
  teamMembers: TeamMemberWithUser[];
  currentGroupMemberIds: string[];
  currentUserId?: string;
  canManage?: boolean;
  onClose: () => void;
  onAddMember: (userId: string, role?: TeamGroupMemberRole) => Promise<void>;
  isAdding?: boolean;
}

export function AddGroupMemberModal({
  visible,
  teamId,
  groupId,
  groupName,
  teamMembers,
  currentGroupMemberIds,
  currentUserId,
  canManage = false,
  onClose,
  onAddMember,
  isAdding = false,
}: AddGroupMemberModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] =
    useState<TeamGroupMemberRole>("member");
  const [userGroupCheck, setUserGroupCheck] = useState<
    Record<string, { canAdd: boolean; existingGroupId?: string }>
  >({});

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setSelectedUserId(null);
      setSelectedRole("member");
      setUserGroupCheck({});
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    setSearchQuery("");
    setSelectedUserId(null);
    setSelectedRole("member");
    setUserGroupCheck({});
    onClose();
  };

  const availableMembers = useMemo(() => {
    return teamMembers.filter(
      (member) => !currentGroupMemberIds.includes(member.user_id),
    );
  }, [teamMembers, currentGroupMemberIds]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return availableMembers;
    const query = searchQuery.toLowerCase();
    return availableMembers.filter(
      (member) =>
        member.user.full_name?.toLowerCase().includes(query) ||
        member.user.email.toLowerCase().includes(query),
    );
  }, [availableMembers, searchQuery]);

  const handleSelectMember = async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();

    if (!userGroupCheck[userId]) {
      const check = await teamMemberService.canUserBeAddedToGroup(
        teamId,
        userId,
      );
      setUserGroupCheck((prev) => ({ ...prev, [userId]: check }));

      if (!check.canAdd) {
        return;
      }
    } else if (!userGroupCheck[userId].canAdd) {
      return;
    }

    setSelectedUserId(userId);
  };

  const handleAdd = async () => {
    if (!selectedUserId || isAdding) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    await onAddMember(selectedUserId, selectedRole);
    handleClose();
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

  const canAdd = !!selectedUserId && !isAdding;

  return (
    <DrawerWithLayout
      visible={visible}
      onClose={handleClose}
      title={t("teams.groups.addMember")}
      subtitle={t("teams.groups.addMemberDescription", { groupName })}
      snapPoints={["75%"]}
      content={
        <VStack className="gap-4 px-6">
          <Box
            className="rounded-xl"
            style={{
              backgroundColor: isDark ? "#0f172a" : "#f8fafc",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
            }}
          >
            <HStack className="items-center gap-2 px-3">
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <BottomSheetDrawerTextInput
                placeholder={t("teams.searchMembers")}
                placeholderTextColor={theme.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  color: theme.textPrimary,
                  fontSize: 15,
                  paddingVertical: 12,
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  activeOpacity={0.7}
                  className="cursor-pointer"
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </HStack>
          </Box>

        {selectedUserId && (
          <VStack className="gap-2">
            <Text
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: theme.textSecondary }}
            >
              {t("teams.groups.role")}
            </Text>
            <HStack className="gap-2">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Keyboard.dismiss();
                  setSelectedRole("member");
                }}
                className="flex-1 cursor-pointer"
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor:
                    selectedRole === "member"
                      ? theme.badgeInfo
                      : isDark
                        ? "#1e293b"
                        : "#ffffff",
                  borderWidth: 1,
                  borderColor:
                    selectedRole === "member"
                      ? theme.badgeInfo
                      : theme.cardBorder,
                }}
              >
                <Text
                  className="text-center text-sm font-semibold"
                  style={{
                    color:
                      selectedRole === "member"
                        ? isDark
                          ? "#ffffff"
                          : "#2563eb"
                        : theme.textPrimary,
                  }}
                >
                  {t("teams.member")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Keyboard.dismiss();
                  setSelectedRole("leader");
                }}
                className="flex-1 cursor-pointer"
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor:
                    selectedRole === "leader"
                      ? theme.badgeWarning
                      : isDark
                        ? "#1e293b"
                        : "#ffffff",
                  borderWidth: 1,
                  borderColor:
                    selectedRole === "leader"
                      ? theme.badgeWarning
                      : theme.cardBorder,
                }}
              >
                <Text
                  className="text-center text-sm font-semibold"
                  style={{
                    color:
                      selectedRole === "leader"
                        ? isDark
                          ? "#ffffff"
                          : "#92400e"
                        : theme.textPrimary,
                  }}
                >
                  {t("teams.groups.leader")}
                </Text>
              </TouchableOpacity>
            </HStack>
          </VStack>
        )}

        {filteredMembers.length === 0 ? (
          <Box className="items-center justify-center py-12">
            <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
            <Text
              className="mt-4 text-center text-base font-medium"
              style={{ color: theme.textPrimary }}
            >
              {searchQuery.trim()
                ? t("teams.noMembersFound")
                : t("teams.groups.allMembersAdded")}
            </Text>
          </Box>
        ) : (
          filteredMembers.map((item) => {
            const isSelected = selectedUserId === item.user_id;
            const check = userGroupCheck[item.user_id];
            const cannotAdd = check && !check.canAdd;
            const initials = getInitials(item.user.full_name, item.user.email);
            const displayName = item.user.full_name || item.user.email.split("@")[0];
            return (
              <TouchableOpacity
                key={item.user_id}
                activeOpacity={0.7}
                onPress={() => handleSelectMember(item.user_id)}
                disabled={cannotAdd}
                className="cursor-pointer"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  backgroundColor: isSelected
                    ? isDark
                      ? "#1e293b"
                      : "#f8fafc"
                    : "transparent",
                  opacity: cannotAdd ? 0.5 : 1,
                }}
              >
                <HStack className="items-center gap-3">
                  <Box
                    className="rounded-xl"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: theme.avatarPrimary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color: isDark ? "#ffffff" : theme.buttonPrimary,
                      }}
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
                    {item.user.full_name && (
                      <Text
                        className="text-sm"
                        style={{ color: theme.textSecondary }}
                      >
                        {item.user.email}
                      </Text>
                    )}
                    {cannotAdd && (
                      <Text className="text-xs" style={{ color: "#dc2626" }}>
                        {t("teams.groups.alreadyInGroup")}
                      </Text>
                    )}
                  </VStack>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.buttonPrimary}
                    />
                  )}
                </HStack>
              </TouchableOpacity>
            );
          })
        )}
        </VStack>
      }
      saveButton={{
        label: t("teams.groups.addMember"),
        onPress: handleAdd,
        disabled: !canAdd,
        loading: isAdding,
      }}
      cancelButton={{
        label: t("common.cancel"),
        onPress: handleClose,
        disabled: isAdding,
      }}
    />
  );
}
