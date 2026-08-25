export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  batch_no?: string | null;
  //bio: string | null;
  headline: string | null;
  /** Spatie role names, e.g. ["student"]. */
  roles: string[];
  /** Flattened Spatie permission names, e.g. ["courses.view"]. */
  permissions: string[];
  email_verified_at: string | null;
  created_at: string;
  is_active: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateProfilePayload {
  name: string;
  phone?: string | null;
  bio?: string | null;
  headline?: string | null;
}
