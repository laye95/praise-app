import { useEffect, useRef } from "react";
import { Modal, TouchableOpacity, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { User } from "@/types/user";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import * as Haptics from "expo-haptics";

interface MemberDetailModalProps {
  visible: boolean;
  member: User | null;
  roleNames?: string[];
  currentUserId?: string;
  onClose: () => void;
  canManageMembers?: boolean;
  onRemoveMember?: (memberId: string) => void;
  onChangeRole?: (memberId: string) => void;
  isRemoving?: boolean;
}

export function MemberDetailModal({
  visible,
  member,
  roleNames = [],
  currentUserId,
  onClose,
  canManageMembers = false,
  onRemoveMember,
  onChangeRole,
  isRemoving = false,
}: MemberDetailModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const translateRoleName = (roleName: string): string => {
    const roleMap: Record<string, string> = {
      "Pastor": t("members.roles.pastor"),
      "Member": t("members.roles.member"),
      "Admin": t("members.roles.admin"),
      "Leader": t("members.roles.leader"),
      "Team Member": t("members.roles.teamMember"),
      "Visitor": t("members.roles.visitor"),
    };
    return roleMap[roleName] || roleName;
  };

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
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClose = (skipAnimation = false) => {
    if (skipAnimation) {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      onClose();
      return;
    }
    
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

  if (!visible || !member) {
    return null;
  }

  const getInitials = () => {
    if (member.full_name) {
      const names = member.full_name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return member.full_name.substring(0, 2).toUpperCase();
    }
    return member.email?.substring(0, 2).toUpperCase() || "U";
  };

  const getRoleBadge = (roleName: string) => {
    const roleConfig: Record<string, { color: string; bg: string }> = {
      Pastor: {
        color: isDark ? "#a5b4fc" : "#6366f1",
        bg: theme.avatarPrimary,
      },
      Member: {
        color: isDark ? "#93c5fd" : "#0284c7",
        bg: theme.badgeInfo,
      },
    };

    const config = roleConfig[roleName] || {
      color: isDark ? "#93c5fd" : "#0284c7",
      bg: theme.badgeInfo,
    };

    return config;
  };
  const joinDate = member.created_at
    ? new Date(member.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

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
            maxHeight: "90%",
          }}
        >
          <SafeAreaView edges={["bottom"]}>
            <Box
              className="rounded-t-3xl"
              style={{
                backgroundColor: theme.pageBg,
                paddingTop: 12,
                paddingBottom: 32,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClose}
                className="cursor-pointer"
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.cardBg,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  zIndex: 10,
                }}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.textPrimary}
                />
              </TouchableOpacity>
              <Box className="items-center mb-6 px-6">
                <Box
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.textTertiary,
                    marginBottom: 24,
                  }}
                />
                <Box
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 20,
                    backgroundColor: theme.avatarPrimary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 36,
                      fontWeight: "700",
                      color: theme.buttonPrimary,
                    }}
                  >
                    {getInitials()}
                  </Text>
                </Box>
                <Text
                  className="text-3xl font-bold mb-3"
                  style={{ color: theme.textPrimary }}
                >
                  {member.full_name || member.email?.split("@")[0] || t("members.roles.member")}
                </Text>
                {roleNames.length > 0 ? (
                  <HStack className="gap-2">
                    {roleNames.map((roleName) => {
                      const roleConfig = getRoleBadge(roleName);
                      return (
                        <Box
                          key={roleName}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: roleConfig.bg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "600",
                              color: roleConfig.color,
                              letterSpacing: 0.5,
                            }}
                          >
                            {translateRoleName(roleName)}
                          </Text>
                        </Box>
                      );
                    })}
                  </HStack>
                ) : (
                  <Box
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: theme.badgeInfo,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: isDark ? "#93c5fd" : "#0284c7",
                        letterSpacing: 0.5,
                      }}
                    >
                      {t("members.roles.member")}
                    </Text>
                  </Box>
                )}
              </Box>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
              >
                <VStack className="gap-3">
                  <Box
                    className="px-5 py-5 rounded-2xl"
                    style={{
                      backgroundColor: theme.cardBg,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.06,
                      shadowRadius: 8,
                      elevation: 3,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <HStack className="items-center gap-4">
                      <Box
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: theme.avatarPrimary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color={theme.buttonPrimary}
                        />
                      </Box>
                      <VStack className="flex-1">
                        <Text
                          className="text-xs font-semibold mb-1"
                          style={{
                            color: theme.textSecondary,
                            letterSpacing: 0.5,
                          }}
                        >
                          {t("members.profile.emailAddress")}
                        </Text>
                        <Text
                          className="text-base font-medium"
                          style={{ color: theme.textPrimary }}
                        >
                          {member.email}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>

                  <Box
                    className="px-5 py-5 rounded-2xl"
                    style={{
                      backgroundColor: theme.cardBg,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.06,
                      shadowRadius: 8,
                      elevation: 3,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <HStack className="items-center gap-4">
                      <Box
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor: theme.avatarPrimary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color={theme.buttonPrimary}
                        />
                      </Box>
                      <VStack className="flex-1">
                        <Text
                          className="text-xs font-semibold mb-1"
                          style={{
                            color: theme.textSecondary,
                            letterSpacing: 0.5,
                          }}
                        >
                          {t("members.profile.joinedChurch")}
                        </Text>
                        <Text
                          className="text-base font-medium"
                          style={{ color: theme.textPrimary }}
                        >
                          {joinDate}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>

                  {member.full_name && (
                    <Box
                      className="px-5 py-5 rounded-2xl"
                      style={{
                        backgroundColor: theme.cardBg,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isDark ? 0.3 : 0.06,
                        shadowRadius: 8,
                        elevation: 3,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                      }}
                    >
                      <HStack className="items-center gap-4">
                        <Box
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: theme.avatarPrimary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name="person-outline"
                            size={20}
                            color={theme.buttonPrimary}
                          />
                        </Box>
                        <VStack className="flex-1">
                          <Text
                            className="text-xs font-semibold mb-1"
                            style={{
                              color: theme.textSecondary,
                              letterSpacing: 0.5,
                            }}
                          >
                            {t("members.profile.fullName")}
                          </Text>
                          <Text
                            className="text-base font-medium"
                            style={{ color: theme.textPrimary }}
                          >
                            {member.full_name}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  )}
                </VStack>
              </ScrollView>

              {canManageMembers && member && currentUserId !== member.id && (
                <VStack className="px-6 mt-4 gap-2">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      if (onChangeRole && member) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        handleClose(true);
                        setTimeout(() => {
                          onChangeRole(member.id);
                        }, 100);
                      }
                    }}
                    className="cursor-pointer"
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: theme.cardBg,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.06,
                      shadowRadius: 8,
                      elevation: 3,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                    }}
                  >
                    <HStack className="items-center justify-center gap-2.5">
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color={theme.buttonPrimary}
                      />
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {t("members.profile.changeRole")}
                      </Text>
                    </HStack>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      if (onRemoveMember && member) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onRemoveMember(member.id);
                        handleClose();
                      }
                    }}
                    disabled={isRemoving}
                    className="cursor-pointer"
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      backgroundColor: isDark ? "#7f1d1d" : "#fef2f2",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.06,
                      shadowRadius: 8,
                      elevation: 3,
                      borderWidth: 1,
                      borderColor: isDark ? "#991b1b" : "#fee2e2",
                      opacity: isRemoving ? 0.5 : 1,
                    }}
                  >
                    <HStack className="items-center justify-center gap-2.5">
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#ffffff"
                      />
                      <Text
                        className="text-sm font-semibold"
                        style={{
                          color: "#ffffff",
                        }}
                      >
                        {t("members.profile.removeFromChurch")}
                      </Text>
                    </HStack>
                  </TouchableOpacity>
                </VStack>
              )}
            </Box>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
