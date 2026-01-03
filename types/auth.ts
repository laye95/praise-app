export interface User {
  id: string;
  email: string;
  full_name?: string;
  role:
    | "super_admin"
    | "church_admin"
    | "co_pastor"
    | "team_leader"
    | "team_member"
    | "member"
    | "visitor";
  church_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterMemberData {
  name: string;
  email: string;
  password: string;
}

export interface RegisterChurchData {
  name: string;
  email: string;
  password: string;
  churchName: string;
  denomination?: string;
  location?: string;
  timezone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: any;
}

export interface RegisterChurchResponse {
  user: User;
  church: any;
}
