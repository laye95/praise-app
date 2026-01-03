import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "./useUserProfile";
import { permissionService, UserPermissions } from "@/services/api/permissionService";
import { queryKeys } from "@/services/queryKeys";
import { AppError } from "@/services/api/baseService";

export function usePermissions() {
  const { user, session } = useAuth();
  const userId = user?.id || session?.user?.id;
  const { data: profile } = useUserProfile(userId);

  const query = useQuery<UserPermissions, AppError>({
    queryKey: queryKeys.permissions.byUserChurch(userId || "", profile?.church_id || ""),
    queryFn: async () => {
      if (!userId || !profile?.church_id) {
        return { permissions: [], roles: [] };
      }
      const result = await permissionService.getUserPermissions(userId, profile.church_id);
      return result;
    },
    enabled: !!userId && !!profile?.church_id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  const can = (permissionKey: string): boolean => {
    if (!query.data) return false;
    return query.data.permissions.includes(permissionKey);
  };

  const hasRole = (roleName: string): boolean => {
    if (!query.data) return false;
    return query.data.roles.some((role) => role.name === roleName);
  };

  const canAny = (permissionKeys: string[]): boolean => {
    if (!query.data) return false;
    return permissionKeys.some((key) => query.data!.permissions.includes(key));
  };

  const canAll = (permissionKeys: string[]): boolean => {
    if (!query.data) return false;
    return permissionKeys.every((key) => query.data!.permissions.includes(key));
  };

  return {
    permissions: query.data?.permissions || [],
    roles: query.data?.roles || [],
    isLoading: query.isLoading,
    can,
    hasRole,
    canAny,
    canAll,
  };
}
