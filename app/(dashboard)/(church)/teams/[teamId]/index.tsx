import { useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, TouchableOpacity, FlatList, View } from "react-native";
import { useLocalSearchParams, router, usePathname } from "expo-router";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "../_hooks/useTeam";
import { useMembers } from "../../members/_hooks/useMembers";
import { EditTeamModal } from "../_components/EditTeamModal";
import { DeleteConfirmationDialog } from "../../members/_components/DeleteConfirmationDialog";
import { useTeams } from "../_hooks/useTeams";
import * as Haptics from "expo-haptics";

type TabType = "members" | "groups" | "calendar" | "documents";

interface TeamTab {
  id: TabType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  visible: boolean;
}

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const pathname = usePathname();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile } = useUserProfile(userId);
  const { can } = usePermissions();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { team, isLeader, isLoading } = useTeam(teamId);
  const { deleteTeam, deleteTeamMutation, updateTeam, updateTeamMutation } = useTeams();

  const isWorshipTeam = team?.type === "worship";
  
  const getActiveTab = (): TabType | null => {
    if (pathname?.includes("/calendar")) return "calendar";
    if (pathname?.includes("/documents")) return "documents";
    if (pathname?.includes("/groups")) return "groups";
    if (pathname?.includes("/members")) return "members";
    return null;
  };
  
  const activeTab = getActiveTab();

  const teamTabs: TeamTab[] = [
    {
      id: "members",
      label: t("teams.members"),
      icon: "people-outline",
      route: `/(dashboard)/(church)/teams/${teamId}/members`,
      visible: true,
    },
    {
      id: "groups",
      label: t("teams.groups.title"),
      icon: "people",
      route: `/(dashboard)/(church)/teams/${teamId}/groups`,
      visible: true,
    },
    {
      id: "calendar",
      label: t("teams.calendar.title"),
      icon: "calendar-outline",
      route: `/(dashboard)/(church)/teams/${teamId}/calendar`,
      visible: true,
    },
    {
      id: "documents",
      label: t("teams.documents.title"),
      icon: "document-text-outline",
      route: `/(dashboard)/(church)/teams/${teamId}/documents`,
      visible: isWorshipTeam,
    },
  ];

  const visibleTabs = teamTabs.filter((tab) => tab.visible);

  const canManage = can("teams:update") || isLeader;
  const canDelete = can("teams:delete");

  const getTeamTypeIcon = (type?: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      worship: "musical-notes",
      prayer: "heart",
      hospitality: "people",
      media: "videocam",
      kids: "happy",
      youth: "school",
      outreach: "hand-left",
      other: "grid",
    };
    return iconMap[type || ""] || "grid";
  };

  const getTeamTypeColor = (type?: string) => {
    const colorMap: Record<string, string> = {
      worship: isDark ? "#a5b4fc" : "#6366f1",
      prayer: isDark ? "#f87171" : "#ef4444",
      hospitality: isDark ? "#34d399" : "#10b981",
      media: isDark ? "#60a5fa" : "#3b82f6",
      kids: isDark ? "#fbbf24" : "#f59e0b",
      youth: isDark ? "#a78bfa" : "#8b5cf6",
      outreach: isDark ? "#fb7185" : "#f43f5e",
      other: isDark ? "#94a3b8" : "#64748b",
    };
    return colorMap[type || ""] || (isDark ? "#94a3b8" : "#64748b");
  };

  const getTeamTypeBg = (type?: string) => {
    const bgMap: Record<string, string> = {
      worship: isDark ? "#312e81" : "#eef2ff",
      prayer: isDark ? "#7f1d1d" : "#fef2f2",
      hospitality: isDark ? "#064e3b" : "#f0fdf4",
      media: isDark ? "#1e3a8a" : "#eff6ff",
      kids: isDark ? "#78350f" : "#fef3c7",
      youth: isDark ? "#581c87" : "#f3e8ff",
      outreach: isDark ? "#831843" : "#fdf2f8",
      other: isDark ? "#1e293b" : "#f1f5f9",
    };
    return bgMap[type || ""] || (isDark ? "#1e293b" : "#f1f5f9");
  };

  if (isLoading || !team) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
        <Box className="items-center justify-center py-20">
          <Text className="text-base" style={{ color: theme.textSecondary }}>
            {t("teams.loadingTeam")}
          </Text>
        </Box>
      </SafeAreaView>
    );
  }

  const iconName = getTeamTypeIcon(team.type);
  const iconColor = getTeamTypeColor(team.type);
  const iconBg = getTeamTypeBg(team.type);



  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <VStack className="flex-1">
        <Box className="px-6 pt-4">
          <HStack className="items-center justify-between mb-4">
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
                    {t("common.back")}
                  </Text>
                </HStack>
              </TouchableOpacity>
              {canDelete && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDeleteDialog(true);
                  }}
                  activeOpacity={0.7}
                  className="cursor-pointer"
                >
                  <Ionicons name="trash-outline" size={24} color="#dc2626" />
                </TouchableOpacity>
              )}
          </HStack>

          <Box
            className="rounded-2xl p-6 mb-4"
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
            <HStack className="items-center gap-4 mb-4">
              <Box className="rounded-xl p-4" style={{ backgroundColor: iconBg }}>
                <Ionicons name={iconName} size={32} color={iconColor} />
              </Box>
              <VStack className="flex-1 gap-1">
                <HStack className="items-center justify-between">
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {team.name}
                  </Text>
                  {canManage && (
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowEditModal(true);
                      }}
                      activeOpacity={0.7}
                      className="cursor-pointer"
                    >
                      <Ionicons name="create-outline" size={22} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </HStack>
                <Box
                  className="rounded px-2 py-0.5 self-start"
                  style={{ backgroundColor: theme.badgeInfo }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: isDark ? "#ffffff" : "#2563eb" }}
                  >
                    {t(`teams.types.${team.type}`)}
                  </Text>
                </Box>
              </VStack>
            </HStack>
            {team.description && (
              <Text className="text-base" style={{ color: theme.textSecondary }}>
                {team.description}
              </Text>
            )}
          </Box>

          <VStack className="gap-3 mb-4">
            <Text className="text-xs font-semibold uppercase tracking-wider px-4" style={{ color: theme.textTertiary }}>
              {t("teams.navigation")}
            </Text>

            <Box
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: theme.cardBg,
                borderWidth: 1,
                borderColor: theme.cardBorder,
              }}
            >
              {visibleTabs.map((tab, index) => {
                const isActive = activeTab === tab.id;
                const isLast = index === visibleTabs.length - 1;
                  const getTabIconColor = () => {
                  if (tab.id === "members") return isDark ? "#c084fc" : "#9333ea";
                  if (tab.id === "groups") return isDark ? "#60a5fa" : "#3b82f6";
                  if (tab.id === "calendar") return isDark ? "#fbbf24" : "#d97706";
                  if (tab.id === "documents") return isDark ? "#34d399" : "#10b981";
                  return isDark ? "#94a3b8" : "#64748b";
                };

                return (
                  <TouchableOpacity
                    key={tab.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(tab.route);
                    }}
                    className="cursor-pointer"
                    style={{
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: theme.cardBorder,
                    }}
                  >
                    <HStack className="items-center px-4 py-4">
                      <Box className="mr-3">
                        <Ionicons
                          name={isActive ? tab.icon.replace("-outline", "") : tab.icon}
                          size={20}
                          color={getTabIconColor()}
                        />
                      </Box>
                      <VStack className="flex-1">
                        <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                          {tab.label}
                        </Text>
                        {tab.id === "members" && (
                          <Text className="text-xs" style={{ color: theme.textSecondary }}>
                            {t("teams.membersSubtitle")}
                          </Text>
                        )}
                        {tab.id === "groups" && (
                          <Text className="text-xs" style={{ color: theme.textSecondary }}>
                            {t("teams.groups.subtitle")}
                          </Text>
                        )}
                        {tab.id === "calendar" && (
                          <Text className="text-xs" style={{ color: theme.textSecondary }}>
                            {t("teams.calendar.subtitle")}
                          </Text>
                        )}
                        {tab.id === "documents" && (
                          <Text className="text-xs" style={{ color: theme.textSecondary }}>
                            {t("teams.documents.subtitle")}
                          </Text>
                        )}
                      </VStack>
                      <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </HStack>
                  </TouchableOpacity>
                );
              })}
            </Box>
          </VStack>
        </Box>

      </VStack>

      <EditTeamModal
        visible={showEditModal}
        teamName={team.name}
        teamDescription={team.description}
        onClose={() => setShowEditModal(false)}
        onSave={async (data) => {
          updateTeam({ teamId, data });
        }}
        isSaving={updateTeamMutation.isPending}
      />


      <DeleteConfirmationDialog
        visible={showDeleteDialog}
        title={t("teams.deleteTeam")}
        message={t("teams.deleteTeamConfirm", { name: team.name })}
        onConfirm={() => {
          deleteTeam(teamId);
          setShowDeleteDialog(false);
          router.back();
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isDeleting={deleteTeamMutation.isPending}
      />
    </SafeAreaView>
  );
}
