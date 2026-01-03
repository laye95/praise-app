export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: "super_admin" | "church_admin" | "co_pastor" | "team_leader" | "team_member" | "member" | "visitor";
  church_id?: string;
  created_at: string;
  updated_at: string;
}
