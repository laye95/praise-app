import {
  CreateMembershipRequestData,
  MembershipRequest,
  MembershipRequestWithChurch,
  MembershipRequestWithUser,
  UpdateMembershipRequestData,
} from "@/types/membership";
import { BaseService } from "./baseService";

export class MembershipRequestService extends BaseService {
  protected tableName = "church_membership_requests";

  async createRequest(
    data: CreateMembershipRequestData,
  ): Promise<MembershipRequest> {
    return this.createWithUser<MembershipRequest, CreateMembershipRequestData>(
      data,
    );
  }

  async listMyRequests(userId: string): Promise<MembershipRequestWithChurch[]> {
    try {
      this.log("info", "Fetching user membership requests", { userId });

      const { data, error } = await this.supabase
        .from(this.tableName!)
        .select(
          `
          *,
          church:churches (
            id,
            name,
            denomination,
            location
          )
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []) as MembershipRequestWithChurch[];
    } catch (error) {
      this.log("error", "Failed to fetch user requests", error);
      throw this.normalizeError(error);
    }
  }

  async listChurchRequests(churchId: string): Promise<MembershipRequest[]> {
    return this.list<MembershipRequest>({
      filters: [{ field: "church_id", operator: "eq", value: churchId }],
      sort: [{ field: "created_at", ascending: false }],
    });
  }

  async listChurchRequestsWithUsers(
    churchId: string,
  ): Promise<MembershipRequestWithUser[]> {
    try {
      this.log("info", "Fetching church membership requests with users", {
        churchId,
      });

      const { data, error } = await this.supabase
        .from(this.tableName!)
        .select(
          `
          *,
          user:users!church_membership_requests_user_id_fkey (
            id,
            email,
            full_name
          )
        `,
        )
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []) as MembershipRequestWithUser[];
    } catch (error) {
      this.log("error", "Failed to fetch church requests with users", error);
      throw this.normalizeError(error);
    }
  }

  async updateRequestStatus(
    requestId: string,
    data: UpdateMembershipRequestData,
  ): Promise<MembershipRequest> {
    const userId = await this.getCurrentUserId();
    return this.update<MembershipRequest, UpdateMembershipRequestData>(
      requestId,
      {
        ...data,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      },
    );
  }

  async acceptRequest(requestId: string): Promise<MembershipRequest> {
    try {
      this.log("info", "Accepting membership request", { requestId });

      const { data, error } = await this.supabase.rpc(
        "accept_membership_request",
        {
          request_id: requestId,
        },
      );

      if (error) {
        this.log("error", "Failed to accept membership request", error);
        throw this.normalizeError(error);
      }

      const updatedRequest = await this.get<MembershipRequest>(requestId);

      this.log("info", "Successfully accepted request and updated user", {
        requestId,
        userId: updatedRequest.user_id,
        churchId: updatedRequest.church_id,
      });

      return updatedRequest;
    } catch (error) {
      this.log("error", "Failed to accept request", error);
      throw this.normalizeError(error);
    }
  }

  async declineRequest(requestId: string): Promise<MembershipRequest> {
    const userId = await this.getCurrentUserId();
    return this.update<MembershipRequest>(requestId, {
      status: "declined",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    });
  }

  async cancelRequest(requestId: string): Promise<MembershipRequest> {
    return this.update<MembershipRequest>(requestId, {
      status: "cancelled",
    });
  }

  async hasPendingRequest(userId: string, churchId: string): Promise<boolean> {
    try {
      const count = await this.count([
        { field: "user_id", operator: "eq", value: userId },
        { field: "church_id", operator: "eq", value: churchId },
        { field: "status", operator: "eq", value: "pending" },
      ]);
      return count > 0;
    } catch (error) {
      return false;
    }
  }
}

export const membershipRequestService = new MembershipRequestService();
