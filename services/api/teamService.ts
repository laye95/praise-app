import { BaseService } from "./baseService";
import { Team, CreateTeamData, UpdateTeamData } from "@/types/team";
import { teamMemberService } from "./teamMemberService";

export class TeamService extends BaseService {
  protected tableName = "teams";

  async getTeamsByChurch(churchId: string): Promise<Team[]> {
    return this.list<Team>({
      filters: [{ field: "church_id", operator: "eq", value: churchId }],
      sort: [{ field: "name", ascending: true }],
    });
  }

  async getTeam(teamId: string): Promise<Team> {
    return this.get<Team>(teamId);
  }

  async createTeam(churchId: string, data: CreateTeamData): Promise<Team> {
    const team = await this.create<Team, Omit<CreateTeamData, "leader_ids" | "member_ids">>({
      church_id: churchId,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      type: data.type,
    });

    const memberPromises: Promise<any>[] = [];

    if (data.leader_ids && data.leader_ids.length > 0) {
      memberPromises.push(
        ...data.leader_ids.map((userId) =>
          teamMemberService.addTeamMember(team.id, {
            user_id: userId,
            role: "leader",
          }),
        ),
      );
    }

    if (data.member_ids && data.member_ids.length > 0) {
      memberPromises.push(
        ...data.member_ids.map((userId) =>
          teamMemberService.addTeamMember(team.id, {
            user_id: userId,
            role: "member",
          }),
        ),
      );
    }

    if (memberPromises.length > 0) {
      await Promise.all(memberPromises);
    }

    return team;
  }

  async updateTeam(teamId: string, data: UpdateTeamData): Promise<Team> {
    const updateData: Partial<Team> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined)
      updateData.description = data.description?.trim() || undefined;
    if (data.type !== undefined) updateData.type = data.type;

    return this.update<Team>(teamId, updateData);
  }

  async deleteTeam(teamId: string): Promise<void> {
    return this.delete(teamId);
  }
}

export const teamService = new TeamService();
