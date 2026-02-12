import { useState, useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { ChurchRole } from "@/services/api/permissionService";
import { User } from "@/types/user";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";

interface RoleSelectionModalProps {
  visible: boolean;
  member: User | null;
  roles: ChurchRole[];
  currentRoleIds: string[];
  onClose: () => void;
  onSaveRoles: (roleIds: string[]) => void;
  isUpdating: boolean;
}

export function RoleSelectionModal({
  visible,
  member,
  roles,
  currentRoleIds,
  onClose,
  onSaveRoles,
  isUpdating,
}: RoleSelectionModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (visible) setSelectedRoleIds([...currentRoleIds]);
    else setSelectedRoleIds([]);
  }, [visible, currentRoleIds]);

  const handleClose = () => {
    setSelectedRoleIds([]);
    onClose();
  };

  const handleToggleRole = (roleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleSave = () => {
    if (!hasChanges || isUpdating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSaveRoles(selectedRoleIds);
  };

  const hasChanges = JSON.stringify([...selectedRoleIds].sort()) !== JSON.stringify([...currentRoleIds].sort());

  return (
    <DrawerWithLayout
      visible={visible}
      onClose={handleClose}
      title={t("members.roles.selectRoles")}
      subtitle={
        member
          ? `${member.full_name || member.email?.split("@")[0] || "Member"} · ${member.email || ""}`
          : t("members.roles.chooseRoles")
      }
      snapPoints={["70%"]}
      content={
        <VStack className="gap-4 px-6">
          <Box
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
                    color: isDark ? "#ffffff" : theme.buttonPrimary,
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

          {roles.length === 0 ? (
            <Box className="items-center justify-center py-8">
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                {t("members.roles.noRolesAvailable")}
              </Text>
            </Box>
          ) : (
            roles.map((item) => {
              const isSelected = selectedRoleIds.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => handleToggleRole(item.id)}
                  disabled={isUpdating}
                  className="cursor-pointer"
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 16,
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
            })
          )}
        </VStack>
      }
      saveButton={{
        label: t("members.roles.saveRoles"),
        onPress: handleSave,
        disabled: isUpdating || !hasChanges,
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
