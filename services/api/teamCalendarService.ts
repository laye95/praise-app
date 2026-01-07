import { BaseService } from "./baseService";
import {
  TeamCalendarEvent,
  CreateCalendarEventData,
  UpdateCalendarEventData,
} from "@/types/teamCalendar";

export class TeamCalendarService extends BaseService {
  protected tableName = "team_calendar_events";

  async getCalendarEvents(
    teamId: string,
    startDate?: string,
    endDate?: string,
    searchQuery?: string,
  ): Promise<TeamCalendarEvent[]> {
    try {
      this.log("info", "Fetching calendar events", { teamId, startDate, endDate, searchQuery });

      let query = this.supabase
        .from(this.tableName!)
        .select(`
          *,
          group:team_groups (
            id,
            name,
            team_id,
            created_at,
            updated_at
          ),
          members:team_calendar_event_members (
            id,
            user_id,
            created_at,
            user:users (
              id,
              email,
              full_name
            )
          )
        `)
        .eq("team_id", teamId)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (startDate) {
        query = query.gte("date", startDate);
      }
      if (endDate) {
        query = query.lte("date", endDate);
      }
      if (searchQuery && searchQuery.trim()) {
        query = query.ilike("title", `%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as TeamCalendarEvent[];
    } catch (error) {
      this.log("error", "Failed to fetch calendar events", error);
      throw this.normalizeError(error);
    }
  }

  async getCalendarEvent(eventId: string): Promise<TeamCalendarEvent> {
    try {
      this.log("info", "Fetching calendar event", { eventId });

      const { data, error } = await this.supabase
        .from(this.tableName!)
        .select(`
          *,
          group:team_groups (
            id,
            name,
            team_id,
            created_at,
            updated_at
          ),
          members:team_calendar_event_members (
            id,
            user_id,
            created_at,
            user:users (
              id,
              email,
              full_name
            )
          )
        `)
        .eq("id", eventId)
        .single();

      if (error) throw error;

      return data as TeamCalendarEvent;
    } catch (error) {
      this.log("error", "Failed to fetch calendar event", error);
      throw this.normalizeError(error);
    }
  }

  async createCalendarEvent(
    teamId: string,
    data: CreateCalendarEventData,
  ): Promise<TeamCalendarEvent> {
    try {
      const userId = await this.getCurrentUserId();
      this.log("info", "Creating calendar event", { teamId, data });

      const insertData: any = {
        team_id: teamId,
        date: data.date,
        end_date: data.end_date || undefined,
        start_time: data.is_all_day ? undefined : (data.start_time || undefined),
        end_time: data.is_all_day ? undefined : (data.end_time || undefined),
        is_all_day: data.is_all_day || false,
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        created_by: userId,
      };

      if (data.group_id) {
        insertData.group_id = data.group_id;
      } else {
        insertData.group_id = null;
      }

      const { data: eventData, error: eventError } = await this.supabase
        .from(this.tableName!)
        .insert(insertData)
        .select(`
          *,
          group:team_groups (
            id,
            name,
            team_id,
            created_at,
            updated_at
          ),
          members:team_calendar_event_members (
            id,
            user_id,
            created_at,
            user:users (
              id,
              email,
              full_name
            )
          )
        `)
        .single();

      if (eventError) throw eventError;

      if (data.member_ids && data.member_ids.length > 0 && !data.group_id) {
        const memberInserts = data.member_ids.map((memberId) => ({
          event_id: eventData.id,
          user_id: memberId,
        }));

        const { error: membersError } = await this.supabase
          .from("team_calendar_event_members")
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      return this.getCalendarEvent(eventData.id);
    } catch (error) {
      this.log("error", "Failed to create calendar event", error);
      throw this.normalizeError(error);
    }
  }

  async updateCalendarEvent(
    eventId: string,
    data: UpdateCalendarEventData,
  ): Promise<TeamCalendarEvent> {
    try {
      this.log("info", "Updating calendar event", { eventId, data });

      const updateData: any = {};
      if (data.date !== undefined) updateData.date = data.date;
      if (data.end_date !== undefined) updateData.end_date = data.end_date || undefined;
      if (data.is_all_day !== undefined) {
        updateData.is_all_day = data.is_all_day;
        if (data.is_all_day) {
          updateData.start_time = undefined;
          updateData.end_time = undefined;
        } else {
          if (data.start_time !== undefined) updateData.start_time = data.start_time || undefined;
          if (data.end_time !== undefined) updateData.end_time = data.end_time || undefined;
        }
      } else {
        if (data.start_time !== undefined) updateData.start_time = data.start_time || undefined;
        if (data.end_time !== undefined) updateData.end_time = data.end_time || undefined;
      }
      if (data.title !== undefined) updateData.title = data.title.trim();
      if (data.description !== undefined)
        updateData.description = data.description.trim() || undefined;
      if (data.group_id !== undefined) {
        updateData.group_id = data.group_id || null;
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString();
        const { error: updateError } = await this.supabase
          .from(this.tableName!)
          .update(updateData)
          .eq("id", eventId);

        if (updateError) throw updateError;
      }

      if (data.member_ids !== undefined) {
        const { error: deleteError } = await this.supabase
          .from("team_calendar_event_members")
          .delete()
          .eq("event_id", eventId);

        if (deleteError) throw deleteError;

        if (data.member_ids.length > 0 && !data.group_id) {
          const memberInserts = data.member_ids.map((memberId) => ({
            event_id: eventId,
            user_id: memberId,
          }));

          const { error: membersError } = await this.supabase
            .from("team_calendar_event_members")
            .insert(memberInserts);

          if (membersError) throw membersError;
        }

        if (data.group_id) {
          const { error: clearMembersError } = await this.supabase
            .from("team_calendar_event_members")
            .delete()
            .eq("event_id", eventId);

          if (clearMembersError) throw clearMembersError;
        }
      } else if (data.group_id !== undefined && data.group_id) {
        const { error: clearMembersError } = await this.supabase
          .from("team_calendar_event_members")
          .delete()
          .eq("event_id", eventId);

        if (clearMembersError) throw clearMembersError;
      }

      return this.getCalendarEvent(eventId);
    } catch (error) {
      this.log("error", "Failed to update calendar event", error);
      throw this.normalizeError(error);
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    try {
      this.log("info", "Deleting calendar event", { eventId });

      const { error } = await this.supabase
        .from(this.tableName!)
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    } catch (error) {
      this.log("error", "Failed to delete calendar event", error);
      throw this.normalizeError(error);
    }
  }

}

export const teamCalendarService = new TeamCalendarService();
