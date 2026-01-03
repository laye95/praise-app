import { Church, CreateChurchData, UpdateChurchData } from "@/types/church";
import { BaseService } from "./baseService";

export class ChurchService extends BaseService {
  protected tableName = "churches";

  async getChurch(id: string): Promise<Church> {
    return this.get<Church>(id);
  }

  async createChurch(data: CreateChurchData): Promise<Church> {
    return this.create<Church, CreateChurchData>({
      name: data.name,
      denomination: data.denomination || undefined,
      location: data.location || undefined,
      timezone: data.timezone || "UTC",
    });
  }

  async updateChurch(id: string, data: UpdateChurchData): Promise<Church> {
    return this.update<Church, UpdateChurchData>(id, data);
  }

  async deleteChurch(id: string): Promise<void> {
    return this.delete(id);
  }

  async getAllChurches(): Promise<Church[]> {
    return this.list<Church>({
      sort: [{ field: "created_at", ascending: false }],
    });
  }

  async searchChurches(searchTerm: string): Promise<Church[]> {
    return this.list<Church>({
      filters: [{ field: "name", operator: "ilike", value: `%${searchTerm}%` }],
      sort: [{ field: "name", ascending: true }],
    });
  }

  async getChurchesPaginated(page: number = 1, limit: number = 10) {
    return this.listPaginated<Church>({
      pagination: { page, limit },
      sort: [{ field: "created_at", ascending: false }],
    });
  }

  async getChurchByLocation(location: string): Promise<Church[]> {
    return this.list<Church>({
      filters: [
        { field: "location", operator: "ilike", value: `%${location}%` },
      ],
    });
  }

  async countChurches(): Promise<number> {
    return this.count();
  }

  async churchExists(id: string): Promise<boolean> {
    return this.exists(id);
  }
}

export const churchService = new ChurchService();
