import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { teamService } from "@/services/api/teamService";
import { teamMemberService } from "@/services/api/teamMemberService";
import { queryKeys } from "@/services/queryKeys";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { AppError } from "@/services/api/baseService";
import { TeamMemberRole } from "@/types/team";
import * as Haptics from "expo-haptics";

export function useTeam(teamId: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profile } = useUserProfile(userId);
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const teamQuery = useQuery({
    queryKey: queryKeys.teams.detail(teamId),
    queryFn: () => teamService.getTeam(teamId),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2,
  });

  const membersQuery = useQuery({
    queryKey: queryKeys.teams.members(teamId),
    queryFn: () => teamMemberService.getTeamMembers(teamId),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2,
  });

  const isLeaderQuery = useQuery({
    queryKey: ["teams", "isLeader", teamId, userId || ""],
    queryFn: () => teamMemberService.checkIsTeamLeader(teamId),
    enabled: !!teamId && !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const myMembershipQuery = useQuery({
    queryKey: queryKeys.teams.myMembership(teamId, userId || ""),
    queryFn: () => teamMemberService.getMyTeamMembership(teamId),
    enabled: !!teamId && !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ userId: memberUserId, role }: { userId: string; role?: TeamMemberRole }) => {
      return teamMemberService.addTeamMember(teamId, {
        user_id: memberUserId,
        role: role || "member",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.members(teamId),
      });
      toast.show({
        title: t("teams.toast.memberAdded"),
        description: t("teams.toast.memberAddedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.toast.addMemberFailed");
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

  const removeMemberMutation = useMutation({
    mutationFn: async (memberUserId: string) => {
      return teamMemberService.removeTeamMember(teamId, memberUserId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.members(teamId),
      });
      toast.show({
        title: t("teams.toast.memberRemoved"),
        description: t("teams.toast.memberRemovedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.toast.removeMemberFailed");
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

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId: memberUserId, role }: { userId: string; role: TeamMemberRole }) => {
      return teamMemberService.updateMemberRole(teamId, memberUserId, role);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.members(teamId),
      });
      toast.show({
        title: t("teams.toast.roleUpdated"),
        description: t("teams.toast.roleUpdatedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.toast.updateRoleFailed");
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
    team: teamQuery.data,
    members: membersQuery.data || [],
    isLeader: isLeaderQuery.data || false,
    myMembership: myMembershipQuery.data,
    isLoading: teamQuery.isLoading || membersQuery.isLoading,
    isLoadingLeader: isLeaderQuery.isLoading,
    addMember: addMemberMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    updateMemberRole: updateMemberRoleMutation.mutate,
    isAddingMember: addMemberMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
    isUpdatingRole: updateMemberRoleMutation.isPending,
  };
}
