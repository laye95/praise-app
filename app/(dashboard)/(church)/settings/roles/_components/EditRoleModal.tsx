import { useState, useEffect } from "react";
import { TouchableOpacity, Keyboard } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Permission,
  ChurchRole,
  permissionService,
} from "@/services/api/permissionService";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  BottomSheetDrawerTextInput,
} from "@/components/ui/BottomSheetDrawer";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";

interface EditRoleModalProps {
  visible: boolean;
  role: ChurchRole | null;
  permissions: Permission[];
  onClose: () => void;
  onSave: (name: string, description: string, permissionKeys: string[]) => Promise<void>;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

export function EditRoleModal({
  visible,
  role,
  permissions,
  onClose,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: EditRoleModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);

  useEffect(() => {
    if (visible && role) {
      setName(role.name);
      setDescription(role.description || "");
      setSearchTerm("");
    } else {
      setName("");
      setDescription("");
      setSearchTerm("");
      setSelectedPermissionKeys([]);
      Keyboard.dismiss();
    }
  }, [visible, role]);

  useEffect(() => {
    if (visible && role) {
      const fetchRolePermissions = async () => {
        try {
          const permissionKeys = await permissionService.getRolePermissions(role.id);
          setSelectedPermissionKeys(permissionKeys);
        } catch (error) {
          console.error("Failed to fetch role permissions", error);
        }
      };
      fetchRolePermissions();
    }
  }, [visible, role]);

  const handleClose = () => {
    Keyboard.dismiss();
    setName("");
    setDescription("");
    setSearchTerm("");
    setSelectedPermissionKeys([]);
    onClose();
  };

  const handleTogglePermission = (permissionKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPermissionKeys((prev) => {
      if (prev.includes(permissionKey)) {
        return prev.filter((key) => key !== permissionKey);
      }
      return [...prev, permissionKey];
    });
  };

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    await onSave(name.trim(), description.trim(), selectedPermissionKeys);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  const canSave = name.trim().length >= 2 && !isSaving;

  if (!role) return null;

  const filteredPermissions = permissions.filter((perm) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      perm.key.toLowerCase().includes(search) ||
      perm.description?.toLowerCase().includes(search)
    );
  });

  const groupedPermissions = filteredPermissions.reduce(
    (acc, perm) => {
      const category = perm.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  const permissionCategories = Object.keys(groupedPermissions).sort();

  return (
    <DrawerWithLayout
      visible={visible && !!role}
      onClose={handleClose}
      title={t("members.roles.editRole")}
      subtitle={role?.description || t("members.roles.selectPermissionsDescription")}
      snapPoints={["75%"]}
      content={
        <VStack className="gap-4 px-6">
          <VStack className="gap-2">
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.textPrimary }}
            >
              {t("members.roles.roleName")}
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
                placeholder={t("members.roles.roleNamePlaceholder")}
                placeholderTextColor={theme.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!isSaving && !role.is_system_role}
                style={{
                  color: theme.textPrimary,
                  fontSize: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              />
            </Box>
          </VStack>

          <VStack className="gap-2">
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.textPrimary }}
            >
              {t("members.roles.roleDescription")}
              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                {" "}({t("common.optional")})
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
                placeholder={t("members.roles.roleDescriptionPlaceholder")}
                placeholderTextColor={theme.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                editable={!isSaving && !role.is_system_role}
                textAlignVertical="top"
                style={{
                  color: theme.textPrimary,
                  fontSize: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  minHeight: 80,
                }}
              />
            </Box>
          </VStack>

          <VStack className="gap-2">
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.textPrimary }}
            >
              {t("members.roles.selectPermissions")}
            </Text>
            <Text
              className="text-xs"
              style={{ color: theme.textSecondary }}
            >
              {t("members.roles.selectPermissionsDescription")}
            </Text>
          </VStack>

          <Box
            className="rounded-xl"
            style={{
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
            }}
          >
            <HStack className="items-center px-4">
              <Ionicons name="search" size={18} color={theme.textTertiary} style={{ marginRight: 8 }} />
              <BottomSheetDrawerTextInput
                placeholder={t("common.search")}
                placeholderTextColor={theme.textTertiary}
                value={searchTerm}
                onChangeText={setSearchTerm}
                returnKeyType="search"
                editable={!isSaving}
                style={{
                  flex: 1,
                  color: theme.textPrimary,
                  fontSize: 16,
                  paddingVertical: 14,
                }}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm("")} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
            </HStack>
          </Box>

          <VStack className="pt-4" style={{ minHeight: 200 }}>
          {permissionCategories.length === 0 ? (
            <Box
              className="rounded-xl py-8"
              style={{ backgroundColor: isDark ? "#1e293b" : "#f3f4f6" }}
            >
              <Text
                className="text-center text-sm"
                style={{ color: theme.textSecondary }}
              >
                {t("members.roles.noPermissionsFound")}
              </Text>
            </Box>
          ) : (
            permissionCategories.map((category) => (
              <VStack key={category} className="mb-4">
                <Text
                  className="mb-2 text-xs font-bold uppercase"
                  style={{ color: theme.textSecondary }}
                >
                  {category}
                </Text>
                {groupedPermissions[category].map((permission) => {
                  const isSelected = selectedPermissionKeys.includes(permission.key);
                  return (
                    <TouchableOpacity
                      key={permission.id}
                      activeOpacity={0.7}
                      onPress={() => handleTogglePermission(permission.key)}
                      disabled={isSaving}
                      className="cursor-pointer"
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        marginBottom: 6,
                        borderRadius: 10,
                        backgroundColor: isSelected
                          ? theme.avatarPrimary
                          : isDark
                            ? "#1e293b"
                            : "#f3f4f6",
                        opacity: isSaving ? 0.5 : 1,
                      }}
                    >
                      <HStack className="items-center gap-3">
                        <Box
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: isSelected
                              ? theme.buttonPrimary
                              : theme.avatarPrimary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name={isSelected ? "checkmark" : "lock-closed-outline"}
                            size={16}
                            color={
                              isSelected
                                ? "#ffffff"
                                : isDark
                                  ? "#94a3b8"
                                  : "#475569"
                            }
                          />
                        </Box>
                        <VStack className="flex-1">
                          <Text
                            className="text-sm font-semibold"
                            style={{
                              color: isSelected
                                ? isDark ? "#ffffff" : "#1e293b"
                                : theme.textPrimary,
                            }}
                          >
                            {permission.key}
                          </Text>
                          {permission.description && (
                            <Text
                              className="text-xs"
                              style={{
                                color: isSelected
                                  ? isDark ? "#cbd5e1" : "#475569"
                                  : theme.textSecondary,
                              }}
                            >
                              {permission.description}
                            </Text>
                          )}
                        </VStack>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={isDark ? "#ffffff" : "#1e293b"}
                          />
                        )}
                      </HStack>
                    </TouchableOpacity>
                  );
                })}
              </VStack>
            ))
          )}
          </VStack>
        </VStack>
      }
      saveButton={{
        label: t("common.save"),
        onPress: handleSave,
        disabled: !canSave || role.is_system_role,
        loading: isSaving,
      }}
      cancelButton={{
        label: t("common.cancel"),
        onPress: handleClose,
        disabled: isSaving,
      }}
      deleteButton={
        !role.is_system_role
          ? {
              label: t("common.delete"),
              onPress: handleDelete,
              disabled: isDeleting,
              loading: isDeleting,
            }
          : undefined
      }
    />
  );
}
