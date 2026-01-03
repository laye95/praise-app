import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { authService } from "@/services/api/authService";
import { AppError, AppErrorCode } from "@/services/api/baseService";

interface UseLoginReturn {
  login: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useLogin(): UseLoginReturn {
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return authService.login({ email, password });
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: async (err: unknown) => {
      let errorMessage = "Failed to sign in. Please try again.";
      
      if (err instanceof AppError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const login = async (email: string, password: string) => {
    setError(null);
    await loginMutation.mutateAsync({ email, password });
  };

  return {
    login,
    isLoading: loginMutation.isPending,
    error,
  };
}
