import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, TouchableOpacity, FlatList } from "react-native";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { permissionService, ChurchRole } from "@/services/api/permissionService";
import { queryKeys } from "@/services/queryKeys";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { CreateRoleModal } from "./_components/CreateRoleModal";
import { EditRoleModal } from "./_components/EditRoleModal";
import { useToast } from "@/hooks/useToast";

export default function RolesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile } = useUserProfile(userId);
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<ChurchRole | null>(null);

  const canManageRoles = can("roles:read");

  useEffect(() => {
    if (!canManageRoles) {
      router.back();
    }
  }, [canManageRoles]);

  const { data: roles, isLoading } = useQuery({
    queryKey: queryKeys.roles.byChurch(profile?.church_id || ""),
    queryFn: () => permissionService.getChurchRoles(profile!.church_id!),
    enabled: !!profile?.church_id && canManageRoles,
    staleTime: 1000 * 60 * 5,
  });

  const { data: permissions } = useQuery({
    queryKey: queryKeys.permissions.all,
    queryFn: () => permissionService.getAllPermissions(),
    enabled: showCreateModal || !!editingRole,
    staleTime: 1000 * 60 * 60,
  });

  const createRoleMutation = useMutation({
    mutationFn: async ({
      name,
      description,
      permissionKeys,
    }: {
      name: string;
      description: string;
      permissionKeys: string[];
    }) => {
      if (!profile?.church_id) throw new Error("Church ID is required");
      return permissionService.createRole(profile.church_id, name, description, permissionKeys);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.byChurch(profile?.church_id || "") });
      toast.success(t("members.roles.roleCreated"), t("members.roles.roleCreatedDescription"));
      setShowCreateModal(false);
    },
    onError: (error: Error) => {
      toast.error(t("common.error"), error.message || t("members.roles.roleCreateFailed"));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      roleId,
      name,
      description,
      permissionKeys,
    }: {
      roleId: string;
      name: string;
      description: string;
      permissionKeys: string[];
    }) => {
      return permissionService.updateRole(roleId, name, description, permissionKeys);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.byChurch(profile?.church_id || "") });
      toast.success(t("members.roles.roleUpdated"), t("members.roles.roleUpdatedDescription"));
      setEditingRole(null);
    },
    onError: (error: Error) => {
      toast.error(t("common.error"), error.message || t("members.roles.roleUpdateFailed"));
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return permissionService.deleteRole(roleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.byChurch(profile?.church_id || "") });
      toast.success(t("members.roles.roleDeleted"), t("members.roles.roleDeletedDescription"));
      setEditingRole(null);
    },
    onError: (error: Error) => {
      toast.error(t("common.error"), error.message || t("members.roles.roleDeleteFailed"));
    },
  });

  if (!canManageRoles) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="px-6 py-4">
          <VStack className="gap-6">
            <HStack className="items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="cursor-pointer"
              >
                <HStack className="items-center gap-2">
                  <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
                  <Text className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                    Back
                  </Text>
                </HStack>
              </TouchableOpacity>
            </HStack>

            <VStack className="gap-2">
              <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>
                {t("members.roles.title")}
              </Text>
              <Text className="text-base" style={{ color: theme.textSecondary }}>
                {t("members.roles.subtitle")}
              </Text>
            </VStack>

            {isLoading ? (
              <Box className="items-center justify-center py-20">
                <Text className="text-base" style={{ color: theme.textSecondary }}>
                  {t("members.roles.loadingRoles")}
                </Text>
              </Box>
            ) : (
              <VStack className="gap-4">
                {roles?.map((role) => (
                  <TouchableOpacity
                    key={role.id}
                    activeOpacity={0.95}
                    onPress={() => {
                      if (can("roles:update") || can("roles:read")) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEditingRole(role);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <Box
                      className="rounded-xl p-4"
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
                      <HStack className="items-center justify-between">
                        <VStack className="flex-1 gap-0.5">
                          <HStack className="items-center gap-2">
                            <Text className="text-base font-bold" style={{ color: theme.textPrimary }}>
                              {role.name}
                            </Text>
                            {role.is_system_role && (
                              <Box
                                className="rounded px-1.5 py-0.5"
                                style={{ backgroundColor: theme.badgeInfo }}
                              >
                                <Text className="text-xs font-semibold" style={{ color: "#ffffff" }}>
                                  System
                                </Text>
                              </Box>
                            )}
                          </HStack>
                          {role.description && (
                            <Text className="text-xs" style={{ color: theme.textSecondary }}>
                              {role.description}
                            </Text>
                          )}
                        </VStack>
                        {(can("roles:update") || can("roles:read")) && (
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={theme.textTertiary}
                          />
                        )}
                      </HStack>
                    </Box>
                  </TouchableOpacity>
                ))}

                {can("roles:create") && (
                  <Button
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowCreateModal(true);
                    }}
                    action="primary"
                    variant="solid"
                    size="lg"
                    className="h-14 cursor-pointer rounded-2xl"
                    style={{
                      backgroundColor: theme.buttonPrimary,
                    }}
                  >
                    <HStack className="items-center gap-2">
                      <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
                      <ButtonText className="text-base font-semibold" style={{ color: "#ffffff" }}>
                        {t("members.roles.createNewRole")}
                      </ButtonText>
                    </HStack>
                  </Button>
                )}
              </VStack>
            )}

            <Box
              className="rounded-xl p-4"
              style={{
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              <VStack className="gap-2">
                <HStack className="items-center gap-2">
                  <Ionicons name="information-circle" size={20} color={theme.buttonPrimary} />
                  <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                    {t("members.roles.aboutRoles")}
                  </Text>
                </HStack>
                <Text className="text-xs" style={{ color: theme.textSecondary }}>
                  {t("members.roles.aboutRolesDescription")}
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </ScrollView>

      <CreateRoleModal
        visible={showCreateModal}
        permissions={permissions || []}
        onClose={() => setShowCreateModal(false)}
        onCreate={async (name, description, permissionKeys) => {
          await createRoleMutation.mutateAsync({ name, description, permissionKeys });
        }}
        isCreating={createRoleMutation.isPending}
      />

      <EditRoleModal
        visible={!!editingRole}
        role={editingRole}
        permissions={permissions || []}
        onClose={() => setEditingRole(null)}
        onSave={async (name, description, permissionKeys) => {
          if (editingRole) {
            await updateRoleMutation.mutateAsync({
              roleId: editingRole.id,
              name,
              description,
              permissionKeys,
            });
          }
        }}
        onDelete={() => {
          if (editingRole && can("roles:delete")) {
            deleteRoleMutation.mutate(editingRole.id);
          }
        }}
        isSaving={updateRoleMutation.isPending}
        isDeleting={deleteRoleMutation.isPending}
      />
    </SafeAreaView>
  );
}
