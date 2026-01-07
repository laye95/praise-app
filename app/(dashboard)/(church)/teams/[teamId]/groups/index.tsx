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
import { useTeam } from "../../_hooks/useTeam";
import { useQuery } from "@tanstack/react-query";
import { useTeamGroups } from "./_hooks/useTeamGroups";
import { teamGroupService } from "@/services/api/teamGroupService";
import { queryKeys } from "@/services/queryKeys";
import { GroupCard } from "./_components/GroupCard";
import { CreateGroupModal } from "./_components/CreateGroupModal";
import * as Haptics from "expo-haptics";

export default function GroupsScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = theme.pageBg === "#0f172a";
  const { can } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { team, isAdmin, isLoading: isLoadingTeam } = useTeam(teamId);
  const { groups, isLoading, createGroup, isCreating } = useTeamGroups(teamId);

  const memberCountsQuery = useQuery({
    queryKey: ["teamGroups", "memberCounts", teamId],
    queryFn: async () => {
      if (!groups.length) return {};
      const counts: Record<string, number> = {};
      await Promise.all(
        groups.map(async (group) => {
          try {
            const members = await teamGroupService.getGroupMembers(group.id);
            counts[group.id] = members.length;
          } catch {
            counts[group.id] = 0;
          }
        }),
      );
      return counts;
    },
    enabled: groups.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const memberCounts = memberCountsQuery.data || {};

  const canManage = can("teams:update") || isAdmin;

  if (isLoadingTeam || !team) {
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
            {canManage && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCreateModal(true);
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
          </HStack>

          <Box className="mb-6">
            <Text className="text-3xl font-bold mb-2" style={{ color: theme.textPrimary }}>
              {team.name}
            </Text>
            <Text className="text-xl font-semibold" style={{ color: theme.textPrimary }}>
              {t("teams.groups.title")} ({groups.length})
            </Text>
          </Box>
        </Box>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          <Box className="px-6 pb-4">
            {isLoading ? (
              <Box className="items-center justify-center py-20">
                <Text className="text-base" style={{ color: theme.textSecondary }}>
                  {t("teams.groups.loading")}
                </Text>
              </Box>
            ) : groups.length === 0 ? (
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
                  {t("teams.groups.noGroups")}
                </Text>
                <Text
                  className="max-w-xs text-center text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  {canManage
                    ? t("teams.groups.noGroupsDescription")
                    : t("teams.groups.noGroupsMemberDescription")}
                </Text>
              </Box>
            ) : (
              <VStack className="gap-3">
                {groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    memberCount={memberCounts[group.id] || 0}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/teams/${teamId}/groups/${group.id}`);
                    }}
                  />
                ))}
              </VStack>
            )}
          </Box>
        </ScrollView>
      </VStack>

      <CreateGroupModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={async (name) => {
          await createGroup(name);
        }}
        isCreating={isCreating}
      />
    </SafeAreaView>
  );
}
