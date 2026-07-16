import { get, post, put } from "@/api/client";
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  ResetPasswordPayload,
  UpdateProfilePayload,
  User,
} from "@/types";

export const authRepository = {
  login(payload: LoginPayload) {
    return post<LoginResponse>("/auth/login", payload);
  },

  logout() {
    return post<void>("/auth/logout");
  },

  me() {
    return get<User>("/auth/me");
  },

  forgotPassword(payload: ForgotPasswordPayload) {
    return post<{ message: string }>("/auth/forgot-password", payload);
  },

  resetPassword(payload: ResetPasswordPayload) {
    return post<{ message: string }>("/auth/reset-password", payload);
  },

  changePassword(payload: ChangePasswordPayload) {
    return put<{ message: string }>("/auth/password", payload);
  },

  updateProfile(payload: UpdateProfilePayload) {
    return put<User>("/auth/profile", payload);
  },

  updateAvatar(file: File) {
    const form = new FormData();
    form.append("avatar", file);
    return post<User>("/auth/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
