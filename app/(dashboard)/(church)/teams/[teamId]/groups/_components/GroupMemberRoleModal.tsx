import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
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
import { TeamGroupMemberRole, TeamGroupMemberWithUser } from "@/types/team";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedRole, setSelectedRole] = useState<TeamGroupMemberRole>(currentRole);

  useEffect(() => {
    if (visible) {
      setSelectedRole(currentRole);
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
    }
  }, [visible, slideAnim, fadeAnim, currentRole]);

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
      onClose();
    });
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

  if (!visible || !member) {
    return null;
  }

  const initials = getInitials(member.user.full_name, member.user.email);
  const displayName =
    member.user.full_name || member.user.email.split("@")[0];
  const hasChanges = selectedRole !== currentRole;
  const canSave = hasChanges && (selectedRole === "member" || canChangeLeadership);

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
                    {t("teams.groups.changeRole")}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.7}
                    disabled={isUpdating}
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
                  {t("teams.groups.changeRoleDescription", { name: displayName })}
                </Text>
              </Box>

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
                    onPress={handleSave}
                    disabled={!canSave || isUpdating}
                    action="primary"
                    variant="solid"
                    size="lg"
                    className="h-14 cursor-pointer rounded-2xl"
                    style={{
                      backgroundColor:
                        canSave && !isUpdating
                          ? theme.buttonPrimary
                          : theme.textTertiary,
                      shadowColor:
                        canSave && !isUpdating
                          ? theme.buttonPrimary
                          : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: canSave && !isUpdating ? 0.3 : 0,
                      shadowRadius: 8,
                      elevation: canSave && !isUpdating ? 4 : 0,
                    }}
                  >
                    {isUpdating ? (
                      <HStack className="items-center gap-2">
                        <ActivityIndicator size="small" color="#ffffff" />
                        <ButtonText
                          className="text-base font-semibold"
                          style={{ color: "#ffffff" }}
                        >
                          {t("teams.groups.updating")}
                        </ButtonText>
                      </HStack>
                    ) : (
                      <ButtonText
                        className="text-base font-semibold"
                        style={{ color: "#ffffff" }}
                      >
                        {t("teams.groups.saveRole")}
                      </ButtonText>
                    )}
                  </Button>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isUpdating}
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
