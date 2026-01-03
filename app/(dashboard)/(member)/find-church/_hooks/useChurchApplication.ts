import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { AppError } from "@/services/api/baseService";
import { churchService } from "@/services/api/churchService";
import { membershipRequestService } from "@/services/api/membershipRequestService";
import { queryKeys } from "@/services/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";

export function useChurchApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [applyingChurchId, setApplyingChurchId] = useState<string | null>(null);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(
    null,
  );

  const churchesQuery = useQuery({
    queryKey: queryKeys.churches.all,
    queryFn: () => churchService.getAllChurches(),
    staleTime: 1000 * 60 * 5,
  });

  const myRequestsQuery = useQuery({
    queryKey: queryKeys.membershipRequests.my(user?.id || ""),
    queryFn: () => membershipRequestService.listMyRequests(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const applyMutation = useMutation({
    mutationFn: async ({
      churchId,
      message,
    }: {
      churchId: string;
      message?: string;
    }) => {
      console.log("[Apply] Starting application for church:", churchId);
      setApplyingChurchId(churchId);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await membershipRequestService.createRequest({
        church_id: churchId,
        message,
      });
      console.log("[Apply] Application created:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("[Apply] Success callback triggered", data);
      setApplyingChurchId(null);
      queryClient.invalidateQueries({
        queryKey: queryKeys.membershipRequests.my(user?.id || ""),
      });
      toast.show({
        title: "Application Sent!",
        description: "Your request has been sent to the church",
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      console.log("[Apply] Error callback triggered", err);
      setApplyingChurchId(null);
      let errorMessage = "Failed to send application. Please try again.";

      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.show({
        title: "Application Failed",
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) => {
      console.log("[Cancel] Starting cancellation for request:", requestId);
      setCancellingRequestId(requestId);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return membershipRequestService.cancelRequest(requestId);
    },
    onSuccess: () => {
      console.log("[Cancel] Success callback triggered");
      setCancellingRequestId(null);
      queryClient.invalidateQueries({
        queryKey: queryKeys.membershipRequests.my(user?.id || ""),
      });
      toast.show({
        title: "Application Cancelled",
        description: "Your request has been cancelled",
        action: "success",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: unknown) => {
      console.log("[Cancel] Error callback triggered", err);
      setCancellingRequestId(null);
      let errorMessage = "Failed to cancel application.";

      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast.show({
        title: "Cancellation Failed",
        description: errorMessage,
        action: "error",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const refetch = useCallback(async () => {
    await Promise.all([churchesQuery.refetch(), myRequestsQuery.refetch()]);
  }, [churchesQuery, myRequestsQuery]);

  return {
    churches: churchesQuery.data || [],
    myRequests: myRequestsQuery.data || [],
    isLoadingChurches: churchesQuery.isLoading,
    isLoadingRequests: myRequestsQuery.isLoading,
    applyToChurch: applyMutation.mutate,
    cancelRequest: cancelMutation.mutate,
    applyingChurchId,
    cancellingRequestId,
    error,
    refetch,
  };
}
