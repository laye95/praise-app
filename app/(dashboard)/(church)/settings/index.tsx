import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, TouchableOpacity } from "react-native";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const theme = useTheme();
  const isDark = theme.pageBg === "#0f172a";
  const { can } = usePermissions();
  const { t } = useTranslation();

  const canManageChurch = can('church:update');
  const canManageRoles = can('roles:read');

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <ScrollView className="flex-1">
        <Box className="px-6 py-4">
          <VStack className="gap-6">
            <VStack className="gap-2">
              <Text className="text-3xl font-bold" style={{ color: theme.textPrimary }}>{t("settings.title")}</Text>
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                {t("settings.subtitle")}
              </Text>
            </VStack>

            {(canManageChurch || canManageRoles) && (
              <VStack className="gap-3">
                <Text className="text-xs font-semibold uppercase tracking-wider px-4" style={{ color: theme.textTertiary }}>
                  {t("settings.churchManagement")}
                </Text>

                <Box
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                  }}
                >
                  {canManageChurch && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push("/(dashboard)/(church)/settings/church-info");
                      }}
                      className="cursor-pointer"
                    >
                      <HStack
                        className="items-center px-4 py-4"
                        style={{
                          borderBottomWidth: canManageRoles ? 1 : 0,
                          borderBottomColor: theme.cardBorder,
                        }}
                      >
                        <Box className="mr-3">
                          <Ionicons name="business" size={20} color={isDark ? "#93c5fd" : "#6366f1"} />
                        </Box>
                        <VStack className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                            {t("settings.churchInformation")}
                          </Text>
                          <Text className="text-xs" style={{ color: theme.textSecondary }}>
                            {t("settings.churchInformationSubtitle")}
                          </Text>
                        </VStack>
                        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                      </HStack>
                    </TouchableOpacity>
                  )}

                  {canManageRoles && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push("/(dashboard)/(church)/settings/roles");
                      }}
                      className="cursor-pointer"
                    >
                      <HStack className="items-center px-4 py-4">
                        <Box className="mr-3">
                          <Ionicons name="shield-checkmark" size={20} color={isDark ? "#fbbf24" : "#d97706"} />
                        </Box>
                        <VStack className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                            {t("settings.rolesPermissions")}
                          </Text>
                          <Text className="text-xs" style={{ color: theme.textSecondary }}>
                            {t("settings.rolesPermissionsSubtitle")}
                          </Text>
                        </VStack>
                        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                      </HStack>
                    </TouchableOpacity>
                  )}
                </Box>
              </VStack>
            )}

            <VStack className="gap-3">
              <Text className="text-xs font-semibold uppercase tracking-wider px-4" style={{ color: theme.textTertiary }}>
                {t("settings.account")}
              </Text>

              <Box
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: theme.cardBg,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/(dashboard)/(church)/settings/profile");
                  }}
                  className="cursor-pointer"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: theme.cardBorder,
                  }}
                >
                  <HStack className="items-center px-4 py-4">
                    <Box className="mr-3">
                      <Ionicons name="person" size={20} color={isDark ? "#c084fc" : "#9333ea"} />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                        {t("settings.profile")}
                      </Text>
                      <Text className="text-xs" style={{ color: theme.textSecondary }}>
                        {user?.email}
                      </Text>
                    </VStack>
                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                  </HStack>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleLogout}
                  className="cursor-pointer"
                >
                  <HStack className="items-center px-4 py-4">
                    <Box className="mr-3">
                      <Ionicons name="log-out" size={20} color={isDark ? "#fca5a5" : "#dc2626"} />
                    </Box>
                    <VStack className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: theme.buttonDecline }}>
                        {t("auth.signOut")}
                      </Text>
                      <Text className="text-xs" style={{ color: theme.textSecondary }}>
                        {t("common.logout")}
                      </Text>
                    </VStack>
                  </HStack>
                </TouchableOpacity>
              </Box>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
