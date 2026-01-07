import { BaseService } from "./baseService";
import {
  TeamGroup,
  TeamGroupMember,
  TeamGroupMemberWithUser,
  TeamGroupWithMembers,
  TeamGroupMemberRole,
} from "@/types/team";

export class TeamGroupService extends BaseService {
  protected tableName = "team_groups";

  async getGroupsByTeam(teamId: string): Promise<TeamGroup[]> {
    try {
      this.log("info", "Fetching groups for team", { teamId });

      const { data, error } = await this.supabase
        .from(this.tableName!)
        .select("*")
        .eq("team_id", teamId)
        .order("name", { ascending: true });

      if (error) throw error;

      return (data || []) as TeamGroup[];
    } catch (error) {
      this.log("error", "Failed to fetch groups", error);
      throw this.normalizeError(error);
    }
  }

  async getGroup(groupId: string): Promise<TeamGroupWithMembers> {
    try {
      this.log("info", "Fetching group", { groupId });

      const { data: groupData, error: groupError } = await this.supabase
        .from(this.tableName!)
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;

      const { data: membersData, error: membersError } = await this.supabase
        .from("team_group_members")
        .select(
          `
          *,
          user:users!team_group_members_user_id_fkey (
            id,
            email,
            full_name
          )
        `,
        )
        .eq("group_id", groupId)
        .order("role", { ascending: false })
        .order("created_at", { ascending: true });

      if (membersError) throw membersError;

      return {
        ...(groupData as TeamGroup),
        members: (membersData || []) as TeamGroupMemberWithUser[],
        member_count: membersData?.length || 0,
      };
    } catch (error) {
      this.log("error", "Failed to fetch group", error);
      throw this.normalizeError(error);
    }
  }

  async createGroup(teamId: string, name: string): Promise<TeamGroup> {
    try {
      this.log("info", "Creating group", { teamId, name });

      const { data, error } = await this.supabase
        .from(this.tableName!)
        .insert({
          team_id: teamId,
          name: name.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      return data as TeamGroup;
    } catch (error) {
      this.log("error", "Failed to create group", error);
      throw this.normalizeError(error);
    }
  }

  async updateGroup(groupId: string, name: string): Promise<TeamGroup> {
    try {
      this.log("info", "Updating group", { groupId, name });

      const { data, error } = await this.supabase
        .from(this.tableName!)
        .update({
          name: name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", groupId)
        .select()
        .single();

      if (error) throw error;

      return data as TeamGroup;
    } catch (error) {
      this.log("error", "Failed to update group", error);
      throw this.normalizeError(error);
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    try {
      this.log("info", "Deleting group", { groupId });

      const { error } = await this.supabase
        .from(this.tableName!)
        .delete()
        .eq("id", groupId);

      if (error) throw error;
    } catch (error) {
      this.log("error", "Failed to delete group", error);
      throw this.normalizeError(error);
    }
  }

  async getGroupMembers(groupId: string): Promise<TeamGroupMemberWithUser[]> {
    try {
      this.log("info", "Fetching group members", { groupId });

      const { data, error } = await this.supabase
        .from("team_group_members")
        .select(
          `
          *,
          user:users!team_group_members_user_id_fkey (
            id,
            email,
            full_name
          )
        `,
        )
        .eq("group_id", groupId)
        .order("role", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []) as TeamGroupMemberWithUser[];
    } catch (error) {
      this.log("error", "Failed to fetch group members", error);
      throw this.normalizeError(error);
    }
  }

  async addGroupMember(
    groupId: string,
    userId: string,
    role: TeamGroupMemberRole = "member",
  ): Promise<TeamGroupMember> {
    try {
      this.log("info", "Adding group member", { groupId, userId, role });

      const { data: groupData } = await this.supabase
        .from(this.tableName!)
        .select("team_id")
        .eq("id", groupId)
        .single();

      if (!groupData) {
        throw new Error("Group not found");
      }

      const { data: existingGroup } = await this.supabase.rpc(
        "get_user_group_for_team",
        {
          check_team_id: groupData.team_id,
          check_user_id: userId,
        },
      );

      if (existingGroup && existingGroup !== groupId) {
        throw new Error(
          "User is already a member of another group in this team",
        );
      }

      const { data, error } = await this.supabase
        .from("team_group_members")
        .insert({
          group_id: groupId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) throw error;

      return data as TeamGroupMember;
    } catch (error) {
      this.log("error", "Failed to add group member", error);
      throw this.normalizeError(error);
    }
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    try {
      this.log("info", "Removing group member", { groupId, userId });

      const { data, error } = await this.supabase
        .from("team_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("Group member not found");
      }
    } catch (error) {
      this.log("error", "Failed to remove group member", error);
      throw this.normalizeError(error);
    }
  }

  async updateGroupMemberRole(
    groupId: string,
    userId: string,
    role: TeamGroupMemberRole,
  ): Promise<TeamGroupMember> {
    try {
      this.log("info", "Updating group member role", { groupId, userId, role });

      const { data: existingMember } = await this.supabase
        .from("team_group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingMember) {
        throw new Error("Group member not found. The member may have been removed from the group.");
      }

      const { data, error } = await this.supabase
        .from("team_group_members")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error("Failed to update group member role. The update did not return any data.");
      }

      return data as TeamGroupMember;
    } catch (error) {
      this.log("error", "Failed to update group member role", error);
      throw this.normalizeError(error);
    }
  }

  async updateGroupMemberPosition(
    groupId: string,
    userId: string,
    position?: string,
  ): Promise<TeamGroupMember> {
    try {
      this.log("info", "Updating group member position", { groupId, userId, position });

      const { data: existingMember } = await this.supabase
        .from("team_group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingMember) {
        throw new Error("Group member not found. The member may have been removed from the group.");
      }

      const { data, error } = await this.supabase
        .from("team_group_members")
        .update({ 
          position: position?.trim() || undefined,
          updated_at: new Date().toISOString() 
        })
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error("Failed to update group member position. The update did not return any data.");
      }

      return data as TeamGroupMember;
    } catch (error) {
      this.log("error", "Failed to update group member position", error);
      throw this.normalizeError(error);
    }
  }

  async getUserGroupForTeam(
    teamId: string,
    userId: string,
  ): Promise<TeamGroup | null> {
    try {
      this.log("info", "Getting user group for team", { teamId, userId });

      const { data, error } = await this.supabase.rpc(
        "get_user_group_for_team",
        {
          check_team_id: teamId,
          check_user_id: userId,
        },
      );

      if (error) throw error;

      if (!data) {
        return null;
      }

      const { data: groupData, error: groupError } = await this.supabase
        .from(this.tableName!)
        .select("*")
        .eq("id", data)
        .single();

      if (groupError) throw groupError;

      return groupData as TeamGroup;
    } catch (error) {
      this.log("error", "Failed to get user group for team", error);
      throw this.normalizeError(error);
    }
  }
}

export const teamGroupService = new TeamGroupService();
