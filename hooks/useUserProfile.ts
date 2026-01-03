import { AppError } from "@/services/api/baseService";
import { userService } from "@/services/api/userService";
import { queryKeys } from "@/services/queryKeys";
import { User } from "@/types/user";
import { useQuery } from "@tanstack/react-query";

export function useUserProfile(userId: string | undefined) {
  const query = useQuery<User, AppError>({
    queryKey: userId ? queryKeys.users.detail(userId) : ["users", "disabled"],
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      const profile = await userService.getUserProfile(userId);
      return profile;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  return query;
}
