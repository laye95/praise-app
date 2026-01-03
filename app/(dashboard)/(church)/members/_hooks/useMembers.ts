import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { userService } from "@/services/api/userService";
import { membershipRequestService } from "@/services/api/membershipRequestService";
import { permissionService } from "@/services/api/permissionService";
import { queryKeys } from "@/services/queryKeys";
import { useToast } from "@/hooks/useToast";
import { AppError } from "@/services/api/baseService";
import * as Haptics from "expo-haptics";

export function useMembers() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profile } = useUserProfile(userId);
  const queryClient = useQueryClient();
  const toast = useToast();

  const membersQuery = useQuery({
    queryKey: queryKeys.users.byChurch(profile?.church_id || ""),
    queryFn: () => userService.getUsersByChurch(profile!.church_id!),
    enabled: !!profile?.church_id,
    staleTime: 1000 * 60 * 2,
  });

  const invitationsQuery = useQuery({
    queryKey: queryKeys.membershipRequests.byChurch(profile?.church_id || ""),
    queryFn: () =>
      membershipRequestService.listChurchRequestsWithUsers(
        profile!.church_id!,
      ),
    enabled: !!profile?.church_id,
    staleTime: 1000 * 60 * 2,
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => {
      return membershipRequestService.acceptRequest(requestId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.membershipRequests.byChurch(profile?.church_id || ""),
      });
      
      await queryClient.refetchQueries({
        queryKey: queryKeys.users.byChurch(profile?.church_id || ""),
      });
      
      await queryClient.refetchQueries({
        queryKey: queryKeys.permissions.userRoles(profile?.church_id || ""),
      });
      
      toast.show({
        title: "Invitation Accepted",
        description: "The member has been added to your church",
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = "Failed to accept invitation";
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: "Error",
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const declineMutation = useMutation({
    mutationFn: (requestId: string) => {
      return membershipRequestService.declineRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.membershipRequests.byChurch(profile?.church_id || ""),
      });
      toast.show({
        title: "Invitation Declined",
        description: "The request has been declined",
        action: "info",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = "Failed to decline invitation";
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: "Error",
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const rolesQuery = useQuery({
    queryKey: queryKeys.permissions.roles(profile?.church_id || ""),
    queryFn: () => permissionService.getChurchRoles(profile!.church_id!),
    enabled: !!profile?.church_id,
    staleTime: 1000 * 60 * 5,
  });

  const userRolesQuery = useQuery({
    queryKey: queryKeys.permissions.userRoles(profile?.church_id || ""),
    queryFn: async () => {
      if (!profile?.church_id || !membersQuery.data) return {};
      const memberIds = membersQuery.data.map((m) => m.id);
      return permissionService.getUserRolesMap(memberIds, profile.church_id);
    },
    enabled: !!profile?.church_id && !!membersQuery.data && membersQuery.data.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { data, error } = await permissionService.supabase.rpc(
        "remove_member_from_church",
        { target_user_id: memberId },
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.byChurch(profile?.church_id || ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.permissions.userRoles(profile?.church_id || ""),
      });
      toast.show({
        title: "Member Removed",
        description: "The member has been removed from your church",
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = "Failed to remove member";
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: "Error",
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const currentRoles = userRolesQuery.data?.[userId] || [];
      
      if (currentRoles.includes(roleId)) {
        await permissionService.removeRoleFromUser(userId, roleId);
      } else {
        await permissionService.assignRoleToUser(userId, roleId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.permissions.userRoles(profile?.church_id || ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.byChurch(profile?.church_id || ""),
      });
      toast.show({
        title: "Role Updated",
        description: "The member's role has been updated",
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = "Failed to update role";
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: "Error",
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: string; roleIds: string[] }) => {
      const currentRoles = userRolesQuery.data?.[userId] || [];
      
      const rolesToAdd = roleIds.filter((id) => !currentRoles.includes(id));
      const rolesToRemove = currentRoles.filter((id) => !roleIds.includes(id));

      await Promise.all([
        ...rolesToAdd.map((roleId) => permissionService.assignRoleToUser(userId, roleId)),
        ...rolesToRemove.map((roleId) => permissionService.removeRoleFromUser(userId, roleId)),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.permissions.userRoles(profile?.church_id || ""),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.byChurch(profile?.church_id || ""),
      });
      toast.show({
        title: "Roles Updated",
        description: "The member's roles have been updated",
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      let errorMessage = "Failed to update roles";
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.show({
        title: "Error",
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  return {
    members: membersQuery.data || [],
    invitations: invitationsQuery.data || [],
    roles: rolesQuery.data || [],
    userRoles: userRolesQuery.data || {},
    isLoadingMembers: membersQuery.isLoading,
    isLoadingInvitations: invitationsQuery.isLoading,
    isLoadingRoles: rolesQuery.isLoading,
    acceptInvitation: acceptMutation.mutate,
    declineInvitation: declineMutation.mutate,
    removeMember: removeMemberMutation.mutate,
    assignRole: assignRoleMutation.mutate,
    updateRoles: updateRolesMutation.mutate,
    updateRolesMutation,
    isAccepting: acceptMutation.isPending,
    isDeclining: declineMutation.isPending,
    isRemoving: removeMemberMutation.isPending,
    isUpdatingRole: updateRolesMutation.isPending,
  };
}
