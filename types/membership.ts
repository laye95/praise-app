export interface MembershipRequest {
  id: string;
  church_id: string;
  user_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  message?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface CreateMembershipRequestData {
  church_id: string;
  message?: string;
}

export interface UpdateMembershipRequestData {
  status?: "accepted" | "declined" | "cancelled";
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface MembershipRequestWithChurch extends MembershipRequest {
  church?: {
    id: string;
    name: string;
    denomination?: string;
    location?: string;
  };
}

export interface MembershipRequestWithUser extends MembershipRequest {
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

