import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Permission } from "@/services/api/permissionService";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CreateRoleModalProps {
  visible: boolean;
  permissions: Permission[];
  onClose: () => void;
  onCreate: (
    name: string,
    description: string,
    permissionKeys: string[],
  ) => Promise<void>;
  isCreating: boolean;
}

export function CreateRoleModal({
  visible,
  permissions,
  onClose,
  onCreate,
  isCreating,
}: CreateRoleModalProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<
    string[]
  >([]);
  const nameInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const searchInputRef = useRef<TextInput>(null);

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
  }, [visible, slideAnim, fadeAnim]);

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

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    await onCreate(name.trim(), description.trim(), selectedPermissionKeys);
  };

  const canCreate = name.trim().length >= 2 && !isCreating;

  if (!visible) {
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
                <Box className="mb-3 items-center">
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
                    {t("members.roles.createNewRole")}
                  </Text>
                </Box>
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
                      editable={!isCreating}
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
                      editable={!isCreating}
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
                      editable={!isCreating}
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
                              disabled={isCreating}
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
                                opacity: isCreating ? 0.5 : 1,
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

              <VStack className="mt-4 gap-2 px-6">
                <Button
                  onPress={handleCreate}
                  action="primary"
                  variant="solid"
                  size="lg"
                  className="h-12 cursor-pointer rounded-xl"
                  isDisabled={!canCreate}
                  style={{
                    backgroundColor: theme.buttonPrimary,
                    opacity: !canCreate ? 0.5 : 1,
                  }}
                >
                  {isCreating ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <ButtonText
                      className="text-base font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      {t("members.roles.createRole")}
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
                  disabled={isCreating}
                >
                  <Text
                    className="text-center text-base font-semibold"
                    style={{
                      color: theme.textPrimary,
                      opacity: isCreating ? 0.5 : 1,
                    }}
                  >
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
              </VStack>
            </Box>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
