/** A named part of the teaching day, e.g. Morning 9:00 AM – 11:00 AM. */
export interface AttendanceSlot {
  id: number;
  name: string;
  /** Formatted by the API in 12-hour form, e.g. "9:00 AM". */
  start_time: string;
  end_time: string;
}

/** The course a student is currently taking, and when they joined it. */
export interface UserEnrollment {
  course: { id: number; title: string } | null;
  enrolled_at: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  batch_no?: string | null;
  /** The daily slot the admin admitted this student into, times already 12-hour. */
  attendance_slot?: AttendanceSlot | null;
  /** From the admission record; null for accounts without a student profile. */
  emergency_contact?: string | null;
  /** Newest unfinished enrolment, or the newest overall once all are done. */
  enrollment?: UserEnrollment | null;
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
