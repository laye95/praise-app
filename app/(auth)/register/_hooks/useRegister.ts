import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/api/authService";
import { AppError, AppErrorCode } from "@/services/api/baseService";
import { queryKeys } from "@/services/queryKeys";
import { RegisterChurchData, RegisterMemberData } from "@/types/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";

interface UseRegisterReturn {
  registerMember: (data: RegisterMemberData) => Promise<void>;
  registerChurch: (data: RegisterChurchData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useRegister(): UseRegisterReturn {
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  const registerMemberMutation = useMutation({
    mutationFn: async (data: RegisterMemberData) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return authService.registerMember(data);
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Welcome!", "Your account has been created successfully");
    },
    onError: async (err: unknown) => {
      let errorMessage = "Failed to create account. Please try again.";

      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const registerChurchMutation = useMutation({
    mutationFn: async (data: RegisterChurchData) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return authService.registerChurch(data);
    },
    onSuccess: async (result) => {
      const registeredUserId = result?.user?.id;

      if (registeredUserId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.permissions.all,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.users.detail(registeredUserId),
        });

        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        toast.success(
          "Church Created!",
          "Your church has been set up successfully",
        );

        router.replace("/(dashboard)/(church)/home");
      } else {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.permissions.all,
        });
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        toast.success(
          "Church Created!",
          "Your church has been set up successfully",
        );
        router.replace("/");
      }
    },
    onError: async (err: unknown) => {
      let errorMessage = "Failed to create church. Please try again.";

      if (err instanceof AppError) {
        if (err.code === AppErrorCode.PERMISSION_DENIED) {
          errorMessage =
            "You don't have permission to create a church. Please contact support.";
        } else {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const registerMember = async (data: RegisterMemberData) => {
    setError(null);
    await registerMemberMutation.mutateAsync(data);
  };

  const registerChurch = async (data: RegisterChurchData) => {
    setError(null);
    await registerChurchMutation.mutateAsync(data);
  };

  return {
    registerMember,
    registerChurch,
    isLoading:
      registerMemberMutation.isPending || registerChurchMutation.isPending,
    error,
  };
}
