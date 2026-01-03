export interface Church {
  id: string;
  name: string;
  denomination?: string;
  location?: string;
  timezone: string;
  logo_url?: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChurchData {
  name: string;
  denomination?: string;
  location?: string;
  timezone?: string;
}

export interface UpdateChurchData {
  name?: string;
  denomination?: string;
  location?: string;
  timezone?: string;
  logo_url?: string;
  cover_image_url?: string;
}
