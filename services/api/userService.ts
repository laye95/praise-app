import { BaseService } from "./baseService";
import { User } from "@/types/user";

export class UserService extends BaseService {
  protected tableName = "users";

  async getUserProfile(userId: string): Promise<User> {
    return this.get<User>(userId);
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    return this.update<User>(userId, data);
  }

  async getUsersByChurch(churchId: string): Promise<User[]> {
    return this.list<User>({
      filters: [{ field: "church_id", operator: "eq", value: churchId }],
      sort: [{ field: "created_at", ascending: false }],
    });
  }
}

export const userService = new UserService();
