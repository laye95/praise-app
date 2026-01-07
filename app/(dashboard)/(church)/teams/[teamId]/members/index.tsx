import { useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Box } from "@/components/ui/box";
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
import { useTeam } from "../../_hooks/useTeam";
import { useMembers } from "../../../members/_hooks/useMembers";
import { useTeamGroups } from "../groups/_hooks/useTeamGroups";
import { teamGroupService } from "@/services/api/teamGroupService";
import { TeamMemberRow } from "../../_components/TeamMemberRow";
import { ManageTeamMembersModal } from "../../_components/ManageTeamMembersModal";
import { PositionModal } from "./_components/PositionModal";
import * as Haptics from "expo-haptics";

export default function TeamMembersScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = theme.pageBg === "#0f172a";
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { can } = usePermissions();
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedMemberForPosition, setSelectedMemberForPosition] = useState<{ id: string; name: string; position?: string } | null>(null);
  const { team, members, isAdmin, isLoading, addMember, removeMember, updatePosition, isAddingMember, isRemovingMember, isUpdatingPosition } = useTeam(teamId);
  const { members: allMembers } = useMembers();

  const memberGroupsQuery = useQuery({
    queryKey: ["teamMembers", "groups", teamId],
    queryFn: async () => {
      if (!members.length) return {};
      const memberGroups: Record<string, string> = {};
      await Promise.all(
        members.map(async (member) => {
          try {
            const group = await teamGroupService.getUserGroupForTeam(teamId, member.user_id);
            if (group) {
              memberGroups[member.user_id] = group.name;
            }
          } catch {
            // User not in a group
          }
        }),
      );
      return memberGroups;
    },
    enabled: members.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const memberGroups = memberGroupsQuery.data || {};

  const canManage = can("teams:update") || isAdmin;
  const canEditPosition = (memberUserId: string) => {
    return canManage || memberUserId === userId;
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

  const admins = members.filter((m) => m.role === "admin");
  const regularMembers = members.filter((m) => m.role === "member");

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
          </HStack>

          <Box className="mb-6">
            <Text className="text-3xl font-bold mb-2" style={{ color: theme.textPrimary }}>
              {team.name}
            </Text>
            <Text className="text-xl font-semibold" style={{ color: theme.textPrimary }}>
              {t("teams.members")} ({members.length})
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
              <HStack className="items-center justify-between">
                <Text className="text-base" style={{ color: theme.textSecondary }}>
                  {t("teams.members")}
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
                        color={isDark ? "#ffffff" : theme.buttonPrimary}
                      />
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: isDark ? "#ffffff" : theme.buttonPrimary }}
                      >
                        {t("teams.manageMembers")}
                      </Text>
                    </HStack>
                  </TouchableOpacity>
                )}
              </HStack>

              {admins.length > 0 && (
                <VStack className="gap-2">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("teams.admins")}
                  </Text>
                  {admins.map((member) => {
                    const groupName = memberGroups[member.user_id];
                    return (
                      <Box key={member.id}>
                        <TeamMemberRow
                          member={member}
                          currentUserId={userId}
                          canManage={canManage}
                          canEditPosition={canEditPosition(member.user_id)}
                          onRemove={removeMember}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedMemberForPosition({
                              id: member.user_id,
                              name: member.user.full_name || member.user.email.split("@")[0],
                              position: member.position,
                            });
                          }}
                          isRemoving={isRemovingMember}
                        />
                        {groupName && (
                          <Box className="ml-16 mt-1">
                            <HStack className="items-center gap-1">
                              <Ionicons
                                name="people"
                                size={12}
                                color={theme.textSecondary}
                              />
                              <Text
                                className="text-xs"
                                style={{ color: theme.textSecondary }}
                              >
                                {t("teams.groups.inGroup")}: {groupName}
                              </Text>
                            </HStack>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              )}

              {regularMembers.length > 0 && (
                <VStack className="gap-2">
                  {admins.length > 0 && (
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.textSecondary }}
                    >
                      {t("teams.members")}
                    </Text>
                  )}
                  {regularMembers.map((member) => {
                    const groupName = memberGroups[member.user_id];
                    return (
                      <Box key={member.id}>
                        <TeamMemberRow
                          member={member}
                          currentUserId={userId}
                          canManage={canManage}
                          canEditPosition={canEditPosition(member.user_id)}
                          onRemove={removeMember}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedMemberForPosition({
                              id: member.user_id,
                              name: member.user.full_name || member.user.email.split("@")[0],
                              position: member.position,
                            });
                          }}
                          isRemoving={isRemovingMember}
                        />
                        {groupName && (
                          <Box className="ml-16 mt-1">
                            <HStack className="items-center gap-1">
                              <Ionicons
                                name="people"
                                size={12}
                                color={theme.textSecondary}
                              />
                              <Text
                                className="text-xs"
                                style={{ color: theme.textSecondary }}
                              >
                                {t("teams.groups.inGroup")}: {groupName}
                              </Text>
                            </HStack>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
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
          </Box>
        </ScrollView>
      </VStack>

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
      {selectedMemberForPosition && (
        <PositionModal
          visible={!!selectedMemberForPosition}
          memberName={selectedMemberForPosition.name}
          currentPosition={selectedMemberForPosition.position}
          onClose={() => setSelectedMemberForPosition(null)}
          onSave={(position) => {
            updatePosition({
              userId: selectedMemberForPosition.id,
              position: position,
            });
            setSelectedMemberForPosition(null);
          }}
          isSaving={isUpdatingPosition}
        />
      )}
    </SafeAreaView>
  );
}
