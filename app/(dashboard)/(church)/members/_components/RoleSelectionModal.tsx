import { useState, useEffect, useRef } from "react";
import { Modal, TouchableOpacity, Animated, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { ChurchRole } from "@/services/api/permissionService";
import { User } from "@/types/user";
import { useTheme } from "@/hooks/useTheme";
import * as Haptics from "expo-haptics";

interface RoleSelectionModalProps {
  visible: boolean;
  member: User | null;
  roles: ChurchRole[];
  currentRoleIds: string[];
  onClose: () => void;
  onSelectRole: (roleId: string) => void;
  isUpdating: boolean;
}

export function RoleSelectionModal({
  visible,
  member,
  roles,
  currentRoleIds,
  onClose,
  onSelectRole,
  isUpdating,
}: RoleSelectionModalProps) {
  const theme = useTheme();
  const isDark = theme.pageBg === "#0f172a";
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const handleSelectRole = (roleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectRole(roleId);
  };

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
            maxHeight: "80%",
          }}
        >
          <SafeAreaView edges={["bottom"]}>
            <Box
              className="rounded-t-3xl"
              style={{
                backgroundColor: theme.cardBg,
                borderTopWidth: 1,
                borderTopColor: theme.cardBorder,
                paddingTop: 8,
                paddingBottom: 32,
              }}
            >
              <VStack className="mb-4">
                <Box className="items-center mb-3">
                  <Box
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.textTertiary,
                      marginBottom: 16,
                    }}
                  />
                  <Text
                    className="text-lg font-bold mb-3"
                    style={{ color: theme.textPrimary }}
                  >
                    Select Role
                  </Text>
                </Box>
                
                <Box
                  className="mx-6 mb-4"
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    borderWidth: 2,
                    borderColor: theme.buttonPrimary,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text
                    className="text-xs font-semibold mb-2"
                    style={{ color: theme.textSecondary }}
                  >
                    CHANGING ROLE FOR:
                  </Text>
                  <HStack className="items-center gap-3">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        backgroundColor: theme.avatarPrimary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          color: theme.buttonPrimary,
                        }}
                      >
                        {member?.full_name
                          ? member.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .substring(0, 2)
                          : member?.email?.substring(0, 2).toUpperCase() || "U"}
                      </Text>
                    </Box>
                    <VStack className="flex-1">
                      <Text
                        className="text-base font-bold"
                        style={{ color: theme.textPrimary }}
                      >
                        {member?.full_name || member?.email?.split("@")[0] || "Member"}
                      </Text>
                      <Text
                        className="text-sm"
                        style={{ color: theme.textSecondary }}
                      >
                        {member?.email || "No email"}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
                
                <Box className="items-center px-6">
                  <Text
                    className="text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    Choose a role to assign
                  </Text>
                </Box>
              </VStack>

              <FlatList
                data={roles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = currentRoleIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSelectRole(item.id)}
                      disabled={isUpdating}
                      className="cursor-pointer"
                      style={{
                        paddingVertical: 16,
                        paddingHorizontal: 16,
                        marginHorizontal: 24,
                        marginBottom: 8,
                        borderRadius: 12,
                        backgroundColor: isSelected
                          ? theme.avatarPrimary
                          : isDark
                            ? "#1e293b"
                            : "#f3f4f6",
                        opacity: isUpdating ? 0.5 : 1,
                      }}
                    >
                      <HStack className="items-center gap-3">
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: isSelected
                              ? theme.buttonPrimary
                              : theme.avatarPrimary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name={isSelected ? "checkmark" : "person-outline"}
                            size={20}
                            color={
                              isSelected
                                ? "#ffffff"
                                : (isDark ? "#94a3b8" : "#475569")
                            }
                          />
                        </Box>
                        <VStack className="flex-1">
                          <HStack className="items-center gap-2">
                            <Text
                              className="text-base font-semibold"
                              style={{
                                color: isSelected
                                  ? (isDark ? "#ffffff" : "#1e293b")
                                  : theme.textPrimary,
                              }}
                            >
                              {item.name}
                            </Text>
                            {item.is_system_role && (
                              <Box
                                style={{
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4,
                                  backgroundColor: theme.badgeInfo,
                                }}
                              >
                                <Text
                                  className="text-xs font-semibold"
                                  style={{
                                    color: isSelected
                                      ? (isDark ? "#ffffff" : "#1e293b")
                                      : (isDark ? "#60a5fa" : "#2563eb"),
                                  }}
                                >
                                  System
                                </Text>
                              </Box>
                            )}
                          </HStack>
                          {item.description && (
                            <Text
                              className="text-sm"
                              style={{
                                color: isSelected
                                  ? (isDark ? "#cbd5e1" : "#475569")
                                  : theme.textSecondary,
                              }}
                            >
                              {item.description}
                            </Text>
                          )}
                        </VStack>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={isDark ? "#ffffff" : "#1e293b"}
                          />
                        )}
                      </HStack>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Box className="items-center justify-center py-8">
                    <Text
                      className="text-sm"
                      style={{ color: theme.textSecondary }}
                    >
                      No roles available
                    </Text>
                  </Box>
                }
                contentContainerStyle={{ paddingBottom: 16 }}
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClose}
                className="cursor-pointer mx-6 mt-2"
                style={{
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: isDark ? "#1e293b" : "#f3f4f6",
                }}
              >
                <Text
                  className="text-base font-semibold text-center"
                  style={{ color: theme.textPrimary }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </Box>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
