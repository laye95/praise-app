import { useState, useEffect, useRef } from "react";
import { Modal, TouchableOpacity, Animated, ActivityIndicator, TextInput, Keyboard, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Permission, ChurchRole, permissionService } from "@/services/api/permissionService";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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
  const insets = useSafeAreaInsets();
  const isDark = theme.pageBg === "#0f172a";
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<string[]>([]);
  const nameInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && role) {
      setName(role.name);
      setDescription(role.description || "");
      setSearchTerm("");
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
      ]).start(() => {
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 100);
      });
    } else {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      setName("");
      setDescription("");
      setSearchTerm("");
      setSelectedPermissionKeys([]);
      Keyboard.dismiss();
    }
  }, [visible, role, slideAnim, fadeAnim]);

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
      setName("");
      setDescription("");
      setSearchTerm("");
      setSelectedPermissionKeys([]);
      onClose();
    });
  };

  const handleTogglePermission = (permissionKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPermissionKeys((prev) => {
      if (prev.includes(permissionKey)) {
        return prev.filter((key) => key !== permissionKey);
      } else {
        return [...prev, permissionKey];
      }
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

  if (!visible || !role) {
    return null;
  }

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
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  const permissionCategories = Object.keys(groupedPermissions).sort();

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
            maxHeight: "85%",
          }}
        >
          <Box
            className="rounded-t-3xl"
            style={{
              backgroundColor: theme.cardBg,
              borderTopWidth: 1,
              borderTopColor: theme.cardBorder,
              paddingTop: 8,
            }}
          >
              <VStack className="mb-4">
                <HStack className="items-center justify-between px-6 mb-3">
                  <Box className="items-center flex-1">
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
                      className="mb-3 text-lg font-bold"
                      style={{ color: theme.textPrimary }}
                    >
                      {t("members.roles.editRole")}
                    </Text>
                  </Box>
                  {!role.is_system_role && (
                    <TouchableOpacity
                      onPress={handleDelete}
                      disabled={isDeleting}
                      activeOpacity={0.7}
                      className="cursor-pointer"
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: isDark ? "#7f1d1d" : "#fee2e2",
                        opacity: isDeleting ? 0.5 : 1,
                      }}
                    >
                      {isDeleting ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Ionicons name="trash-outline" size={20} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  )}
                </HStack>
              </VStack>

              <VStack className="mb-4 gap-4 px-6">
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
                    <TextInput
                      ref={nameInputRef}
                      placeholder={t("members.roles.roleNamePlaceholder")}
                      placeholderTextColor={theme.textTertiary}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      returnKeyType="next"
                      editable={!isSaving && !role.is_system_role}
                      onSubmitEditing={() =>
                        descriptionInputRef.current?.focus()
                      }
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
                    <Text
                      className="text-xs"
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
                    <TextInput
                      ref={descriptionInputRef}
                      placeholder={t(
                        "members.roles.roleDescriptionPlaceholder",
                      )}
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
                    <Ionicons
                      name="search"
                      size={18}
                      color={theme.textTertiary}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      ref={searchInputRef}
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
                      <TouchableOpacity
                        onPress={() => setSearchTerm("")}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={theme.textTertiary}
                        />
                      </TouchableOpacity>
                    )}
                  </HStack>
                </Box>
              </VStack>

              <ScrollView
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={() => Keyboard.dismiss()}
                contentContainerStyle={{ paddingBottom: 20 }}
                style={{ maxHeight: 300 }}
              >
                <VStack className="px-6 pt-4">
                  {permissionCategories.length === 0 ? (
                    <Box
                      className="rounded-xl py-8"
                      style={{
                        backgroundColor: isDark ? "#1e293b" : "#f3f4f6",
                      }}
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
                          const isSelected = selectedPermissionKeys.includes(
                            permission.key,
                          );
                          return (
                            <TouchableOpacity
                              key={permission.id}
                              activeOpacity={0.7}
                              onPress={() =>
                                handleTogglePermission(permission.key)
                              }
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
                                    name={
                                      isSelected
                                        ? "checkmark"
                                        : "lock-closed-outline"
                                    }
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
                                        ? isDark
                                          ? "#ffffff"
                                          : "#1e293b"
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
                                          ? isDark
                                            ? "#cbd5e1"
                                            : "#475569"
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
              </ScrollView>

              <VStack
                className="mt-4 gap-2 px-6"
                style={{ paddingBottom: Math.max(insets.bottom, 16) }}
              >
                <Button
                  onPress={handleSave}
                  action="primary"
                  variant="solid"
                  size="lg"
                  className="h-12 cursor-pointer rounded-xl"
                  isDisabled={!canSave || role.is_system_role}
                  style={{
                    backgroundColor: theme.buttonPrimary,
                    opacity: !canSave || role.is_system_role ? 0.5 : 1,
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <ButtonText
                      className="text-base font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      {t("common.save")}
                    </ButtonText>
                  )}
                </Button>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClose}
                  className="cursor-pointer"
                  style={{
                    paddingVertical: 16,
                    borderRadius: 12,
                    backgroundColor: isDark ? "#1e293b" : "#f3f4f6",
                  }}
                  disabled={isSaving}
                >
                  <Text
                    className="text-center text-base font-semibold"
                    style={{
                      color: theme.textPrimary,
                      opacity: isSaving ? 0.5 : 1,
                    }}
                  >
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
              </VStack>
            </Box>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
