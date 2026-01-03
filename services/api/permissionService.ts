import { BaseService } from "./baseService";

export interface Permission {
  id: string;
  key: string;
  description?: string;
  category?: string;
  created_at: string;
}

export interface ChurchRole {
  id: string;
  church_id: string;
  name: string;
  description?: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  permissions: string[];
  roles: ChurchRole[];
}

export class PermissionService extends BaseService {
  async getUserPermissions(
    userId: string,
    churchId: string,
  ): Promise<UserPermissions> {
    try {
      this.log("info", "Fetching user permissions", { userId, churchId });

      const { data, error } = await this.supabase.rpc(
        "get_user_permissions",
        {
          target_user_id: userId,
          target_church_id: churchId,
        },
      );

      if (error) throw error;

      return data || { permissions: [], roles: [] };
    } catch (error) {
      this.log("error", "Failed to fetch user permissions", error);
      throw this.normalizeError(error);
    }
  }

  async getAllPermissions(): Promise<Permission[]> {
    try {
      this.log("info", "Fetching all permissions");

      const { data, error } = await this.supabase
        .from("permissions")
        .select("*")
        .order("category", { ascending: true })
        .order("key", { ascending: true });

      if (error) throw error;

      return (data || []) as Permission[];
    } catch (error) {
      this.log("error", "Failed to fetch permissions", error);
      throw this.normalizeError(error);
    }
  }

  async getChurchRoles(churchId: string): Promise<ChurchRole[]> {
    try {
      this.log("info", "Fetching church roles", { churchId });

      const { data, error } = await this.supabase
        .from("church_roles")
        .select("*")
        .eq("church_id", churchId)
        .order("is_system_role", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;

      return (data || []) as ChurchRole[];
    } catch (error) {
      this.log("error", "Failed to fetch church roles", error);
      throw this.normalizeError(error);
    }
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
  ): Promise<void> {
    try {
      this.log("info", "Assigning role to user", { userId, roleId });

      const currentUserId = await this.getCurrentUserId();

      const { error } = await this.supabase
        .from("user_church_roles")
        .insert({
          user_id: userId,
          church_role_id: roleId,
          assigned_by: currentUserId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          this.log("info", "Role already assigned", { userId, roleId });
          return;
        }
        throw error;
      }

      this.log("info", "Successfully assigned role", { userId, roleId });
    } catch (error) {
      this.log("error", "Failed to assign role", error);
      throw this.normalizeError(error);
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      this.log("info", "Removing role from user", { userId, roleId });

      const { error } = await this.supabase
        .from("user_church_roles")
        .delete()
        .eq("user_id", userId)
        .eq("church_role_id", roleId);

      if (error) throw error;

      this.log("info", "Successfully removed role", { userId, roleId });
    } catch (error) {
      this.log("error", "Failed to remove role", error);
      throw this.normalizeError(error);
    }
  }

  async getUserRoles(userId: string, churchId: string): Promise<string[]> {
    try {
      this.log("info", "Fetching user roles", { userId, churchId });

      const { data, error } = await this.supabase
        .from("user_church_roles")
        .select("church_role_id")
        .eq("user_id", userId)
        .in(
          "church_role_id",
          this.supabase
            .from("church_roles")
            .select("id")
            .eq("church_id", churchId),
        );

      if (error) throw error;

      return (data || []).map((r) => r.church_role_id);
    } catch (error) {
      this.log("error", "Failed to fetch user roles", error);
      throw this.normalizeError(error);
    }
  }

  async getUserRolesMap(
    userIds: string[],
    churchId: string,
  ): Promise<Record<string, string[]>> {
    try {
      this.log("info", "Fetching user roles map", { userIds, churchId });

      const { data: roleIds } = await this.supabase
        .from("church_roles")
        .select("id")
        .eq("church_id", churchId);

      const churchRoleIds = roleIds?.map((r) => r.id) || [];

      if (churchRoleIds.length === 0) {
        const rolesMap: Record<string, string[]> = {};
        userIds.forEach((id) => {
          rolesMap[id] = [];
        });
        return rolesMap;
      }

      const { data, error } = await this.supabase
        .from("user_church_roles")
        .select("user_id, church_role_id")
        .in("user_id", userIds)
        .in("church_role_id", churchRoleIds);

      if (error) throw error;

      const rolesMap: Record<string, string[]> = {};
      userIds.forEach((id) => {
        rolesMap[id] = [];
      });

      (data || []).forEach((r) => {
        if (!rolesMap[r.user_id]) {
          rolesMap[r.user_id] = [];
        }
        rolesMap[r.user_id].push(r.church_role_id);
      });

      return rolesMap;
    } catch (error) {
      this.log("error", "Failed to fetch user roles map", error);
      throw this.normalizeError(error);
    }
  }
}

export const permissionService = new PermissionService();
