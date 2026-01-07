import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { teamMemberService } from "@/services/api/teamMemberService";
import { TeamType } from "@/types/team";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMembers } from "../members/_hooks/useMembers";
import { CreateTeamModal } from "./_components/CreateTeamModal";
import { TeamCard } from "./_components/TeamCard";
import { useTeams } from "./_hooks/useTeams";

const TEAM_TYPES: TeamType[] = [
  "worship",
  "prayer",
  "hospitality",
  "media",
  "kids",
  "youth",
  "outreach",
  "other",
];

export default function TeamsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.pageBg === "#0f172a";
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile } = useUserProfile(userId);
  const { can, hasRole } = usePermissions();
  const isPastor = hasRole("Pastor");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TeamType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { teams, isLoading, createTeam, createTeamMutation } = useTeams();
  const { members } = useMembers();

  const canCreateTeam = can("teams:create");

  const myTeamsQuery = useQuery({
    queryKey: ["teams", "myTeams", userId || ""],
    queryFn: () => teamMemberService.getMyTeams(),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const myTeamIds = myTeamsQuery.data || [];

  const memberCountsQuery = useQuery({
    queryKey: ["teams", "memberCounts", profile?.church_id || ""],
    queryFn: async () => {
      if (!teams.length) return {};
      const counts: Record<string, number> = {};
      await Promise.all(
        teams.map(async (team) => {
          try {
            const teamMembers = await teamMemberService.getTeamMembers(team.id);
            counts[team.id] = teamMembers.length;
          } catch {
            counts[team.id] = 0;
          }
        }),
      );
      return counts;
    },
    enabled: teams.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const memberCounts = memberCountsQuery.data || {};

  const filteredTeams = useMemo(() => {
    let filtered = isPastor
      ? teams
      : teams.filter((team) => myTeamIds.includes(team.id));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(query) ||
          team.description?.toLowerCase().includes(query),
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((team) => team.type === typeFilter);
    }

    return filtered;
  }, [teams, myTeamIds, searchQuery, typeFilter, isPastor]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const teamsToCount = isPastor
      ? teams
      : teams.filter((team) => myTeamIds.includes(team.id));
    teamsToCount.forEach((team) => {
      counts[team.type] = (counts[team.type] || 0) + 1;
    });
    return counts;
  }, [teams, myTeamIds, isPastor]);

  const handleCreateTeam = async (data: {
    name: string;
    description?: string;
    type: TeamType;
    admin_ids: string[];
    member_ids?: string[];
  }) => {
    await createTeamMutation.mutateAsync(data);
    setShowCreateModal(false);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.pageBg }}>
      <VStack className="flex-1">
        <Box className="px-6 pb-4 pt-6">
          <HStack className="items-center justify-between">
            <VStack className="flex-1 gap-2">
              <Text
                className="text-3xl font-bold"
                style={{ color: theme.textPrimary }}
              >
                {t("teams.title")}
              </Text>
              <Text
                className="text-base"
                style={{ color: theme.textSecondary }}
              >
                {t("teams.subtitle")}
              </Text>
            </VStack>
            {canCreateTeam && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCreateModal(true);
                }}
                activeOpacity={0.7}
                className="cursor-pointer"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: theme.buttonPrimary,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.15,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Ionicons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            )}
          </HStack>
        </Box>

        {teams.length > 0 && (
          <Box className="mb-4 px-6">
            <HStack className="gap-2" style={{ flexWrap: "wrap" }}>
              <TouchableOpacity
                onPress={() => setTypeFilter(null)}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor:
                    typeFilter === null ? theme.tabActive : theme.tabInactiveBg,
                  borderWidth: 1,
                  borderColor:
                    typeFilter === null ? theme.tabActive : theme.cardBorder,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color:
                      typeFilter === null ? "#ffffff" : theme.tabInactiveText,
                  }}
                >
                  {t("teams.all")} (
                  {teams.filter((team) => myTeamIds.includes(team.id)).length})
                </Text>
              </TouchableOpacity>
              {TEAM_TYPES.map((type) => {
                const count = typeCounts[type] || 0;
                if (count === 0) return null;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() =>
                      setTypeFilter(typeFilter === type ? null : type)
                    }
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor:
                        typeFilter === type
                          ? theme.tabActive
                          : theme.tabInactiveBg,
                      borderWidth: 1,
                      borderColor:
                        typeFilter === type
                          ? theme.tabActive
                          : theme.cardBorder,
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color:
                          typeFilter === type
                            ? "#ffffff"
                            : theme.tabInactiveText,
                      }}
                    >
                      {t(`teams.types.${type}`)} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </HStack>
          </Box>
        )}

        <Box className="mb-4 px-6">
          <Box
            className="rounded-xl"
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
            <HStack className="items-center gap-3 px-4 py-3">
              <Ionicons name="search" size={20} color={theme.textTertiary} />
              <TextInput
                placeholder={t("teams.searchTeams")}
                placeholderTextColor={theme.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: theme.textPrimary,
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  activeOpacity={0.7}
                  className="cursor-pointer"
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={theme.textTertiary}
                  />
                </TouchableOpacity>
              )}
            </HStack>
          </Box>
        </Box>

        <Box className="flex-1 px-6">
          {isLoading || myTeamsQuery.isLoading ? (
            <Box className="items-center justify-center py-20">
              <Text
                className="text-base"
                style={{ color: theme.textSecondary }}
              >
                {t("teams.loadingTeams")}
              </Text>
            </Box>
          ) : (
            <FlatList
              data={filteredTeams}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TeamCard
                  team={item}
                  memberCount={memberCounts[item.id] || 0}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/(dashboard)/(church)/teams/${item.id}`);
                  }}
                />
              )}
              ListEmptyComponent={
                <Box className="items-center justify-center py-20">
                  <Box
                    style={{
                      borderRadius: 999,
                      backgroundColor: theme.emptyBg,
                      padding: 20,
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons
                      name={
                        searchQuery || typeFilter
                          ? "search-outline"
                          : "grid-outline"
                      }
                      size={48}
                      color={theme.textTertiary}
                    />
                  </Box>
                  <Text
                    className="mb-2 text-xl font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {searchQuery || typeFilter
                      ? t("teams.noTeamsFound")
                      : t("teams.noTeamsYet")}
                  </Text>
                  <Text
                    className="max-w-xs text-center text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {searchQuery || typeFilter
                      ? t("teams.noTeamsMessage")
                      : t("teams.noTeamsEmptyMessage")}
                  </Text>
                </Box>
              }
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Box>
      </VStack>

      <CreateTeamModal
        visible={showCreateModal}
        members={members}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTeam}
        isCreating={createTeamMutation.isPending}
      />
    </SafeAreaView>
  );
}
