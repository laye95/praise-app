export type TeamType =
  | "worship"
  | "prayer"
  | "hospitality"
  | "media"
  | "kids"
  | "youth"
  | "outreach"
  | "other";

export type TeamMemberRole = "admin" | "member";
export type TeamGroupMemberRole = "leader" | "member";

export interface Team {
  id: string;
  church_id: string;
  name: string;
  description?: string;
  type: TeamType;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamMemberRole;
  position?: string;
  created_at: string;
  updated_at?: string;
}

export interface TeamMemberWithUser extends TeamMember {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface TeamWithMembers extends Team {
  members?: TeamMemberWithUser[];
  member_count?: number;
}

export interface TeamGroup {
  id: string;
  team_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TeamGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: TeamGroupMemberRole;
  position?: string;
  created_at: string;
  updated_at?: string;
}

export interface TeamGroupMemberWithUser extends TeamGroupMember {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface TeamGroupWithMembers extends TeamGroup {
  members?: TeamGroupMemberWithUser[];
  member_count?: number;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  type: TeamType;
  admin_ids: string[];
  member_ids?: string[];
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  type?: TeamType;
}

export interface AddTeamMemberData {
  user_id: string;
  role?: TeamMemberRole;
}
