import { BaseService } from "./baseService";
import {
  TeamMember,
  TeamMemberWithUser,
  TeamMemberRole,
  AddTeamMemberData,
} from "@/types/team";

export class TeamMemberService extends BaseService {
  protected tableName = "team_members";

  async getTeamMembers(teamId: string): Promise<TeamMemberWithUser[]> {
    try {
      this.log("info", "Fetching team members", { teamId });

      const { data, error } = await this.supabase
        .from(this.tableName!)
        .select(
          `
          *,
          user:users!team_members_user_id_fkey (
            id,
            email,
            full_name
          )
        `,
        )
        .eq("team_id", teamId)
        .order("role", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []) as TeamMemberWithUser[];
    } catch (error) {
      this.log("error", "Failed to fetch team members", error);
      throw this.normalizeError(error);
    }
  }

  async addTeamMember(
    teamId: string,
    data: AddTeamMemberData,
  ): Promise<TeamMember> {
    try {
      this.log("info", "Adding team member", { teamId, userId: data.user_id });

      const { data: memberData, error } = await this.supabase
        .from(this.tableName!)
        .insert({
          team_id: teamId,
          user_id: data.user_id,
          role: data.role || "member",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("User is already a member of this team");
        }
        throw error;
      }

      return memberData as TeamMember;
    } catch (error) {
      this.log("error", "Failed to add team member", error);
      throw this.normalizeError(error);
    }
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    try {
      this.log("info", "Removing team member", { teamId, userId });

      const { error } = await this.supabase
        .from(this.tableName!)
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (error) {
      this.log("error", "Failed to remove team member", error);
      throw this.normalizeError(error);
    }
  }

  async updateMemberRole(
    teamId: string,
    userId: string,
    role: TeamMemberRole,
  ): Promise<TeamMember> {
    try {
      this.log("info", "Updating team member role", {
        teamId,
        userId,
        role,
      });

      const { data, error } = await this.supabase
        .from(this.tableName!)
        .update({ role })
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return data as TeamMember;
    } catch (error) {
      this.log("error", "Failed to update team member role", error);
      throw this.normalizeError(error);
    }
  }

  async checkIsTeamLeader(teamId: string): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();

      const { data, error } = await this.supabase.rpc("is_team_leader", {
        check_team_id: teamId,
      });

      if (error) throw error;

      return data === true;
    } catch (error) {
      this.log("error", "Failed to check team leader status", error);
      return false;
    }
  }

  async getMyTeamMembership(
    teamId: string,
  ): Promise<TeamMember | null> {
    try {
      const userId = await this.getCurrentUserId();

      const { data, error } = await this.supabase
        .from(this.tableName!)
        .select("*")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data as TeamMember;
    } catch (error) {
      this.log("error", "Failed to fetch team membership", error);
      return null;
    }
  }
}

export const teamMemberService = new TeamMemberService();
