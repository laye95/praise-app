import { useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "../../../_hooks/useTeam";
import { useTeamGroups, useTeamGroup } from "../_hooks/useTeamGroups";
import { GroupMemberRow } from "../_components/GroupMemberRow";
import { AddGroupMemberModal } from "../_components/AddGroupMemberModal";
import { GroupMemberRoleModal } from "../_components/GroupMemberRoleModal";
import { DeleteConfirmationDialog } from "../../../../members/_components/DeleteConfirmationDialog";
import { PositionModal } from "../../members/_components/PositionModal";
import { TeamGroupMemberWithUser, TeamGroupMemberRole } from "@/types/team";
import * as Haptics from "expo-haptics";

export default function GroupDetailScreen() {
  const { teamId, groupId } = useLocalSearchParams<{ teamId: string; groupId: string }>();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = theme.pageBg === "#0f172a";
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { can } = usePermissions();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMemberForRole, setSelectedMemberForRole] = useState<TeamGroupMemberWithUser | null>(null);
  const { team, members: teamMembers, isAdmin } = useTeam(teamId);
  const { deleteGroup, isDeleting } = useTeamGroups(teamId);
  const {
    group,
    isLoading,
    addMember,
    removeMember,
    updateMemberRole,
    updateMemberPosition,
    isAddingMember,
    isRemovingMember,
    isUpdatingRole,
    isUpdatingPosition,
  } = useTeamGroup(groupId);

  const isGroupLeader =
    group?.members?.some(
      (m) => m.user_id === userId && m.role === "leader",
    ) || false;
  const canManage = can("teams:update") || isAdmin || isGroupLeader;
  const canChangeLeadership = can("teams:update") || isAdmin;
  const canDeleteGroup = can("teams:update") || isAdmin;

  if (isLoading || !group || !team) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
        <Box className="items-center justify-center py-20">
          <Text className="text-base" style={{ color: theme.textSecondary }}>
            {t("teams.groups.loading")}
          </Text>
        </Box>
      </SafeAreaView>
    );
  }

  const groupMemberIds = group.members?.map((m) => m.user_id) || [];
  const leaders = group.members?.filter((m) => m.role === "leader") || [];
  const regularMembers = group.members?.filter((m) => m.role === "member") || [];

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
            <HStack className="items-center gap-2">
              {canManage && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAddModal(true);
                  }}
                  activeOpacity={0.7}
                  className="cursor-pointer"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.buttonPrimary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="add" size={24} color="#ffffff" />
                </TouchableOpacity>
              )}
              {canDeleteGroup && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDeleteDialog(true);
                  }}
                  activeOpacity={0.7}
                  className="cursor-pointer"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isDark ? "#7f1d1d" : "#fef2f2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={isDark ? "#f87171" : "#ef4444"}
                  />
                </TouchableOpacity>
              )}
            </HStack>
          </HStack>

          <Box className="mb-6">
            <Text className="text-3xl font-bold mb-2" style={{ color: theme.textPrimary }}>
              {group.name}
            </Text>
            <Text className="text-xl font-semibold" style={{ color: theme.textPrimary }}>
              {t("teams.groups.members")} ({group.member_count || 0})
            </Text>
          </Box>
        </Box>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          <Box className="px-6 pb-4">
            <VStack className="gap-4">
              {leaders.length > 0 && (
                <VStack className="gap-2">
                  <Text className="text-base font-semibold" style={{ color: theme.textSecondary }}>
                    {t("teams.groups.leaders")} ({leaders.length})
                  </Text>
                  {leaders.map((member) => (
                    <GroupMemberRow
                      key={member.id}
                      member={member}
                      currentUserId={userId}
                      canManage={canManage}
                      canChangeLeadership={canChangeLeadership}
                      onRemove={canManage ? (userId) => removeMember(userId) : undefined}
                      onUpdateRole={canManage ? (userId, role) => updateMemberRole({ userId, role }) : undefined}
                      onPress={canManage ? () => setSelectedMemberForRole(member) : undefined}
                      isRemoving={isRemovingMember}
                    />
                  ))}
                </VStack>
              )}

              {regularMembers.length > 0 && (
                <VStack className="gap-2">
                  <Text className="text-base font-semibold" style={{ color: theme.textSecondary }}>
                    {t("teams.members")} ({regularMembers.length})
                  </Text>
                  {regularMembers.map((member) => (
                    <GroupMemberRow
                      key={member.id}
                      member={member}
                      currentUserId={userId}
                      canManage={canManage}
                      canChangeLeadership={canChangeLeadership}
                      onRemove={canManage ? (userId) => removeMember(userId) : undefined}
                      onUpdateRole={canManage ? (userId, role) => updateMemberRole({ userId, role }) : undefined}
                      onUpdatePosition={canManage ? (userId, position) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedMemberForPosition({
                          id: userId,
                          name: member.user.full_name || member.user.email.split("@")[0],
                          position: position,
                        });
                      } : undefined}
                      onPress={canManage ? () => setSelectedMemberForRole(member) : undefined}
                      isRemoving={isRemovingMember}
                    />
                  ))}
                </VStack>
              )}

              {group.member_count === 0 && (
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
                    {t("teams.groups.noMembers")}
                  </Text>
                  <Text
                    className="max-w-xs text-center text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {canManage
                      ? t("teams.groups.noMembersDescription")
                      : t("teams.groups.noMembersMemberDescription")}
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        </ScrollView>
      </VStack>

      <AddGroupMemberModal
        visible={showAddModal}
        teamId={teamId}
        groupId={groupId}
        groupName={group.name}
        teamMembers={teamMembers}
        currentGroupMemberIds={groupMemberIds}
        currentUserId={userId}
        canManage={canManage}
        onClose={() => setShowAddModal(false)}
        onAddMember={async (userId, role) => {
          await addMember({ userId, role });
        }}
        isAdding={isAddingMember}
      />

      <GroupMemberRoleModal
        visible={selectedMemberForRole !== null}
        member={selectedMemberForRole}
        currentRole={selectedMemberForRole?.role || "member"}
        canChangeLeadership={canChangeLeadership}
        onClose={() => setSelectedMemberForRole(null)}
        onUpdateRole={async (role: TeamGroupMemberRole) => {
          if (selectedMemberForRole) {
            await updateMemberRole({ userId: selectedMemberForRole.user_id, role });
            setSelectedMemberForRole(null);
          }
        }}
        isUpdating={isUpdatingRole}
      />

      <DeleteConfirmationDialog
        visible={showDeleteDialog}
        title={t("teams.groups.deleteGroup")}
        message={t("teams.groups.deleteGroupConfirm")}
        onConfirm={async () => {
          await deleteGroup(groupId);
          router.back();
        }}
        onCancel={() => {
          setShowDeleteDialog(false);
        }}
        isDeleting={isDeleting}
      />

      {selectedMemberForPosition && (
        <PositionModal
          visible={!!selectedMemberForPosition}
          memberName={selectedMemberForPosition.name}
          currentPosition={selectedMemberForPosition.position}
          onClose={() => setSelectedMemberForPosition(null)}
          onSave={async (position) => {
            await updateMemberPosition({ userId: selectedMemberForPosition.id, position });
            setSelectedMemberForPosition(null);
          }}
          isSaving={isUpdatingPosition}
        />
      )}
    </SafeAreaView>
  );
}
