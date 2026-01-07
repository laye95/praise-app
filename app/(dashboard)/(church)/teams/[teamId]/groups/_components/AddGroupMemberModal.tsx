import { useEffect, useRef, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { TeamGroupMemberRole, TeamMemberWithUser } from "@/types/team";
import { User } from "@/types/user";
import { teamMemberService } from "@/services/api/teamMemberService";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<TeamGroupMemberRole>("member");
  const [userGroupCheck, setUserGroupCheck] = useState<Record<string, { canAdd: boolean; existingGroupId?: string }>>({});

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      setSearchQuery("");
      setSelectedUserId(null);
      setSelectedRole("member");
      setUserGroupCheck({});
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSearchQuery("");
      setSelectedUserId(null);
      setSelectedRole("member");
      setUserGroupCheck({});
      onClose();
    });
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
    
    if (!userGroupCheck[userId]) {
      const check = await teamMemberService.canUserBeAddedToGroup(teamId, userId);
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

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          opacity: fadeAnim,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1 }}
          onPress={handleClose}
        />
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: slideAnim }],
            maxHeight: "95%",
          }}
        >
          <Box
            className="rounded-t-3xl"
            style={{
              backgroundColor: theme.cardBg,
              borderTopWidth: 1,
              borderTopColor: theme.cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <VStack className="gap-0">
              <Box className="items-center pt-4 pb-2">
                <Box
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.textTertiary,
                    opacity: 0.5,
                  }}
                />
              </Box>

              <Box className="px-6 pt-4 pb-4">
                <HStack className="items-center justify-between mb-1">
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {t("teams.groups.addMember")}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.7}
                    disabled={isAdding}
                    className="cursor-pointer"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </HStack>
                <Text
                  className="text-sm mt-1"
                  style={{ color: theme.textSecondary }}
                >
                  {t("teams.groups.addMemberDescription", { groupName })}
                </Text>
              </Box>

              <Box className="px-6 pb-4">
                <Box
                  className="rounded-xl"
                  style={{
                    backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                    borderWidth: 1,
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                  }}
                >
                  <HStack className="items-center gap-2 px-3">
                    <Ionicons
                      name="search"
                      size={18}
                      color={theme.textSecondary}
                    />
                    <TextInput
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
              </Box>

              <Box style={{ maxHeight: 400 }}>
                {filteredMembers.length === 0 ? (
                  <Box className="items-center justify-center py-12 px-6">
                    <Ionicons
                      name="people-outline"
                      size={48}
                      color={theme.textTertiary}
                    />
                    <Text
                      className="mt-4 text-base font-medium text-center"
                      style={{ color: theme.textPrimary }}
                    >
                      {searchQuery.trim()
                        ? t("teams.noMembersFound")
                        : t("teams.groups.allMembersAdded")}
                    </Text>
                  </Box>
                ) : (
                  <FlatList
                    data={filteredMembers}
                    keyExtractor={(item) => item.user_id}
                    renderItem={({ item }) => {
                      const isSelected = selectedUserId === item.user_id;
                      const check = userGroupCheck[item.user_id];
                      const cannotAdd = check && !check.canAdd;
                      const initials = getInitials(
                        item.user.full_name,
                        item.user.email,
                      );
                      const displayName =
                        item.user.full_name || item.user.email.split("@")[0];

                      return (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleSelectMember(item.user_id)}
                          disabled={cannotAdd}
                          className="cursor-pointer"
                          style={{
                            paddingHorizontal: 24,
                            paddingVertical: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.cardBorder,
                            backgroundColor: isSelected
                              ? (isDark ? "#1e293b" : "#f8fafc")
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
                                <Text
                                  className="text-xs"
                                  style={{ color: "#dc2626" }}
                                >
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
                    }}
                    contentContainerStyle={{ paddingBottom: 16 }}
                  />
                )}
              </Box>

              {selectedUserId && (
                <Box className="px-6 pb-4">
                  <VStack className="gap-3">
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
                          onPress={() => setSelectedRole("member")}
                          className="cursor-pointer flex-1"
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
                          onPress={() => setSelectedRole("leader")}
                          className="cursor-pointer flex-1"
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
                  </VStack>
                </Box>
              )}

              <Box
                className="border-t px-6 pt-4"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: theme.cardBorder,
                  backgroundColor: theme.cardBg,
                  paddingBottom: Math.max(insets.bottom, 16),
                }}
              >
                <VStack className="gap-3">
                  <Button
                    onPress={handleAdd}
                    disabled={!canAdd}
                    action="primary"
                    variant="solid"
                    size="lg"
                    className="h-14 cursor-pointer rounded-2xl"
                    style={{
                      backgroundColor: canAdd
                        ? theme.buttonPrimary
                        : theme.textTertiary,
                      shadowColor: canAdd ? theme.buttonPrimary : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: canAdd ? 0.3 : 0,
                      shadowRadius: 8,
                      elevation: canAdd ? 4 : 0,
                    }}
                  >
                    {isAdding ? (
                      <HStack className="items-center gap-2">
                        <ActivityIndicator size="small" color="#ffffff" />
                        <ButtonText
                          className="text-base font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          {t("teams.groups.adding")}
                        </ButtonText>
                      </HStack>
                    ) : (
                      <ButtonText
                        className="text-base font-semibold"
                        style={{ color: "#ffffff" }}
                      >
                        {t("teams.groups.addMember")}
                      </ButtonText>
                    )}
                  </Button>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isAdding}
                    activeOpacity={0.7}
                    className="cursor-pointer"
                  >
                    <Text
                      className="py-3 text-center text-base font-semibold"
                      style={{ color: theme.textSecondary }}
                    >
                      {t("common.cancel")}
                    </Text>
                  </TouchableOpacity>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
