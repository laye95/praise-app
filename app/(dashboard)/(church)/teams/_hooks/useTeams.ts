import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { teamService } from "@/services/api/teamService";
import { queryKeys } from "@/services/queryKeys";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { AppError } from "@/services/api/baseService";
import { Team, CreateTeamData, UpdateTeamData } from "@/types/team";
import * as Haptics from "expo-haptics";

export function useTeams() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profile } = useUserProfile(userId);
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams.byChurch(profile?.church_id || ""),
    queryFn: () => teamService.getTeamsByChurch(profile!.church_id!),
    enabled: !!profile?.church_id,
    staleTime: 1000 * 60 * 2,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: CreateTeamData) => {
      if (!profile?.church_id) throw new Error("Church ID is required");
      return teamService.createTeam(profile.church_id, data);
    },
    onSuccess: async (team) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.byChurch(profile?.church_id || ""),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.members(team.id),
      });
      toast.show({
        title: t("teams.toast.teamCreated"),
        description: t("teams.toast.teamCreatedDescription", { name: team.name }),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.toast.createTeamFailed");
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: t("common.error"),
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, data }: { teamId: string; data: UpdateTeamData }) => {
      return teamService.updateTeam(teamId, data);
    },
    onSuccess: async (team) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.byChurch(profile?.church_id || ""),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.detail(team.id),
      });
      toast.show({
        title: t("teams.toast.teamUpdated"),
        description: t("teams.toast.teamUpdatedDescription", { name: team.name }),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.toast.updateTeamFailed");
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: t("common.error"),
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return teamService.deleteTeam(teamId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.byChurch(profile?.church_id || ""),
      });
      toast.show({
        title: t("teams.toast.teamDeleted"),
        description: t("teams.toast.teamDeletedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.toast.deleteTeamFailed");
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: t("common.error"),
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  return {
    teams: teamsQuery.data || [],
    isLoading: teamsQuery.isLoading,
    createTeam: createTeamMutation.mutate,
    updateTeam: updateTeamMutation.mutate,
    deleteTeam: deleteTeamMutation.mutate,
    createTeamMutation,
    updateTeamMutation,
    deleteTeamMutation,
    isCreating: createTeamMutation.isPending,
    isUpdating: updateTeamMutation.isPending,
    isDeleting: deleteTeamMutation.isPending,
  };
}
