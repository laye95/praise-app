import { TeamGroup } from "./team";

export interface TeamCalendarEventMember {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface TeamCalendarEvent {
  id: string;
  team_id: string;
  group_id?: string;
  date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  title: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  group?: TeamGroup;
  members?: TeamCalendarEventMember[];
}

export interface CreateCalendarEventData {
  date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  title: string;
  description?: string;
  group_id?: string;
  member_ids?: string[];
}

export interface UpdateCalendarEventData {
  date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  title?: string;
  description?: string;
  group_id?: string | null;
  member_ids?: string[];
}

export interface TeamDocument {
  id: string;
  team_id: string;
  event_id?: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}
