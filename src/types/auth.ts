export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  company_id: string;
  roles: Array<{
    id: string;
    name: string;
  }>;
  permissions: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_in?: number;
  message?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  company_name: string;
  company_email: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  country?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  default_farm_id?: string;
  notifications_enabled: boolean;
}
