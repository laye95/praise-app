import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamGroupService } from "@/services/api/teamGroupService";
import { queryKeys } from "@/services/queryKeys";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import { AppError } from "@/services/api/baseService";
import {
  TeamGroup,
  TeamGroupWithMembers,
  TeamGroupMemberRole,
} from "@/types/team";
import * as Haptics from "expo-haptics";

export function useTeamGroups(teamId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const groupsQuery = useQuery({
    queryKey: queryKeys.teamGroups.all(teamId),
    queryFn: () => teamGroupService.getGroupsByTeam(teamId),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      return teamGroupService.createGroup(teamId, name);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamGroups.all(teamId),
      });
      toast.show({
        title: t("teams.groups.groupCreated"),
        description: t("teams.groups.groupCreatedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.groups.createGroupFailed");
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

  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, name }: { groupId: string; name: string }) => {
      return teamGroupService.updateGroup(groupId, name);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamGroups.all(teamId),
      });
      toast.show({
        title: t("teams.groups.groupUpdated"),
        description: t("teams.groups.groupUpdatedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.groups.updateGroupFailed");
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

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return teamGroupService.deleteGroup(groupId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamGroups.all(teamId),
      });
      toast.show({
        title: t("teams.groups.groupDeleted"),
        description: t("teams.groups.groupDeletedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.groups.deleteGroupFailed");
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
    groups: groupsQuery.data || [],
    isLoading: groupsQuery.isLoading,
    createGroup: createGroupMutation.mutate,
    updateGroup: updateGroupMutation.mutate,
    deleteGroup: deleteGroupMutation.mutate,
    isCreating: createGroupMutation.isPending,
    isUpdating: updateGroupMutation.isPending,
    isDeleting: deleteGroupMutation.isPending,
  };
}

export function useTeamGroup(groupId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const groupQuery = useQuery({
    queryKey: queryKeys.teamGroups.detail(groupId),
    queryFn: () => teamGroupService.getGroup(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2,
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role?: TeamGroupMemberRole;
    }) => {
      return teamGroupService.addGroupMember(groupId, userId, role);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamGroups.detail(groupId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamGroups.members(groupId),
      });
      toast.show({
        title: t("teams.groups.memberAdded"),
        description: t("teams.groups.memberAddedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.groups.addMemberFailed");
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
    mutationFn: async (userId: string) => {
      return teamGroupService.removeGroupMember(groupId, userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamGroups.detail(groupId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamGroups.members(groupId),
      });
      toast.show({
        title: t("teams.groups.memberRemoved"),
        description: t("teams.groups.memberRemovedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.groups.removeMemberFailed");
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
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: TeamGroupMemberRole;
    }) => {
      return teamGroupService.updateGroupMemberRole(groupId, userId, role);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamGroups.detail(groupId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamGroups.members(groupId),
      });
      toast.show({
        title: t("teams.groups.roleUpdated"),
        description: t("teams.groups.roleUpdatedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.groups.updateRoleFailed");
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

  const updateMemberPositionMutation = useMutation({
    mutationFn: async ({
      userId,
      position,
    }: {
      userId: string;
      position?: string;
    }) => {
      return teamGroupService.updateGroupMemberPosition(groupId, userId, position);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamGroups.detail(groupId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamGroups.members(groupId),
      });
      toast.show({
        title: t("teams.groups.positionUpdated"),
        description: t("teams.groups.positionUpdatedDescription"),
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = t("teams.groups.updatePositionFailed");
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
    group: groupQuery.data,
    isLoading: groupQuery.isLoading,
    addMember: addMemberMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    updateMemberRole: updateMemberRoleMutation.mutate,
    updateMemberPosition: updateMemberPositionMutation.mutate,
    isAddingMember: addMemberMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
    isUpdatingRole: updateMemberRoleMutation.isPending,
    isUpdatingPosition: updateMemberPositionMutation.isPending,
  };
}
