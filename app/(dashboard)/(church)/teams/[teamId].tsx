import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, TouchableOpacity, FlatList } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "./_hooks/useTeam";
import { useMembers } from "../members/_hooks/useMembers";
import { TeamMemberRow } from "./_components/TeamMemberRow";
import { ManageTeamMembersModal } from "./_components/ManageTeamMembersModal";
import { EditTeamModal } from "./_components/EditTeamModal";
import { DeleteConfirmationDialog } from "../members/_components/DeleteConfirmationDialog";
import { useTeams } from "./_hooks/useTeams";
import * as Haptics from "expo-haptics";

export default function TeamDetailScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile } = useUserProfile(userId);
  const { can } = usePermissions();
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { team, members, isLeader, isLoading, addMember, removeMember, isAddingMember, isRemovingMember } = useTeam(teamId);
  const { members: allMembers } = useMembers();
  const { deleteTeam, deleteTeamMutation, updateTeam, updateTeamMutation } = useTeams();

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

  const leaders = members.filter((m) => m.role === "leader");
  const regularMembers = members.filter((m) => m.role === "member");

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
              className="rounded-2xl p-6"
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
                      style={{ color: "#ffffff" }}
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

            <VStack className="gap-4">
              <HStack className="items-center justify-between">
                <Text
                  className="text-xl font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  {t("teams.members")} ({members.length})
                </Text>
                {canManage && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowManageModal(true);
                    }}
                    activeOpacity={0.7}
                    className="cursor-pointer"
                  >
                    <HStack className="items-center gap-2">
                      <Ionicons
                        name="person-add-outline"
                        size={20}
                        color="#ffffff"
                      />
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: "#ffffff" }}
                      >
                        {t("teams.manageMembers")}
                      </Text>
                    </HStack>
                  </TouchableOpacity>
                )}
              </HStack>

              {leaders.length > 0 && (
                <VStack className="gap-2">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("teams.leaders")}
                  </Text>
                  {leaders.map((member) => (
                    <TeamMemberRow
                      key={member.id}
                      member={member}
                      currentUserId={userId}
                      canManage={canManage}
                      onRemove={removeMember}
                      isRemoving={isRemovingMember}
                    />
                  ))}
                </VStack>
              )}

              {regularMembers.length > 0 && (
                <VStack className="gap-2">
                  {leaders.length > 0 && (
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.textSecondary }}
                    >
                      {t("teams.members")}
                    </Text>
                  )}
                  {regularMembers.map((member) => (
                    <TeamMemberRow
                      key={member.id}
                      member={member}
                      currentUserId={userId}
                      canManage={canManage}
                      onRemove={removeMember}
                      isRemoving={isRemovingMember}
                    />
                  ))}
                </VStack>
              )}

              {members.length === 0 && (
                <Box className="items-center justify-center py-12">
                  <Box
                    style={{
                      borderRadius: 999,
                      backgroundColor: theme.emptyBg,
                      padding: 20,
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons
                      name="people-outline"
                      size={48}
                      color={theme.textTertiary}
                    />
                  </Box>
                  <Text
                    className="mb-2 text-xl font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {t("teams.noMembersInTeam")}
                  </Text>
                  <Text
                    className="max-w-xs text-center text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("teams.noMembersInTeamDescription")}
                  </Text>
                </Box>
              )}
            </VStack>
          </VStack>
        </Box>
      </ScrollView>

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

      <ManageTeamMembersModal
        visible={showManageModal}
        teamId={teamId}
        teamName={team.name}
        members={members}
        allMembers={allMembers}
        currentUserId={userId}
        canManage={canManage}
        onClose={() => setShowManageModal(false)}
        onAddMember={async (userId, role) => {
          await addMember({ userId, role });
        }}
        onRemoveMember={removeMember}
        isAdding={isAddingMember}
        isRemoving={isRemovingMember}
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
