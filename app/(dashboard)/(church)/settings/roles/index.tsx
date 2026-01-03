import { useEffect } from "react";
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
import { useUserProfile } from "@/hooks/useUserProfile";
import { permissionService } from "@/services/api/permissionService";
import { queryKeys } from "@/services/queryKeys";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

export default function RolesScreen() {
  const theme = useTheme();
  const isDark = theme.pageBg === "#0f172a";
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile } = useUserProfile(userId);
  const { can } = usePermissions();

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
                Roles & Permissions
              </Text>
              <Text className="text-base" style={{ color: theme.textSecondary }}>
                Manage church roles and control access to features
              </Text>
            </VStack>

            {isLoading ? (
              <Box className="items-center justify-center py-20">
                <Text className="text-base" style={{ color: theme.textSecondary }}>
                  Loading roles...
                </Text>
              </Box>
            ) : (
              <VStack className="gap-4">
                {roles?.map((role) => (
                  <Box
                    key={role.id}
                    className="rounded-2xl p-5"
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
                    <VStack className="gap-3">
                      <HStack className="items-start justify-between">
                        <VStack className="flex-1 gap-1">
                          <HStack className="items-center gap-2">
                            <Text className="text-lg font-bold" style={{ color: theme.textPrimary }}>
                              {role.name}
                            </Text>
                            {role.is_system_role && (
                              <Box
                                className="rounded px-2 py-0.5"
                                style={{ backgroundColor: theme.badgeInfo }}
                              >
                                <Text className="text-xs font-semibold" style={{ color: "#ffffff" }}>
                                  System
                                </Text>
                              </Box>
                            )}
                          </HStack>
                          {role.description && (
                            <Text className="text-sm" style={{ color: theme.textSecondary }}>
                              {role.description}
                            </Text>
                          )}
                        </VStack>
                        {!role.is_system_role && can("roles:update") && (
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            className="cursor-pointer"
                          >
                            <Ionicons name="ellipsis-horizontal" size={20} color={theme.textTertiary} />
                          </TouchableOpacity>
                        )}
                      </HStack>
                    </VStack>
                  </Box>
                ))}

                {can("roles:create") && (
                  <Button
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    variant="outline"
                    size="lg"
                    className="h-14 cursor-pointer rounded-2xl"
                    style={{
                      borderWidth: 1.5,
                      borderColor: theme.buttonPrimary,
                      backgroundColor: theme.cardBg,
                    }}
                  >
                    <HStack className="items-center gap-2">
                      <Ionicons name="add-circle-outline" size={20} color={theme.buttonPrimary} />
                      <ButtonText className="text-base font-semibold" style={{ color: theme.buttonPrimary }}>
                        Create New Role
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
                    About Roles
                  </Text>
                </HStack>
                <Text className="text-xs" style={{ color: theme.textSecondary }}>
                  Roles define what members can do in your church. System roles (Pastor, Member) are 
                  created automatically and cannot be deleted. You can create custom roles to match 
                  your church's structure.
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
