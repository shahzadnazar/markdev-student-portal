import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { tokenStorage } from "@/lib/storage";

/** Fired when the API answers 401 so the auth layer can reset the session. */
export const UNAUTHORIZED_EVENT = "markdev:unauthorized";

/** Normalized API error shape shared across the app. */
export class ApiError extends Error {
  status: number;
  /** Laravel validation errors keyed by field name. */
  errors: Record<string, string[]>;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

const baseURL = `${import.meta.env.VITE_API_URL ?? ""}/api/v1`;

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const status = error.response?.status ?? 0;

    if (status === 401) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    const message =
      error.response?.data?.message ??
      (status === 0
        ? "Cannot reach the MarkDev server. Check your connection and try again."
        : "Something went wrong. Please try again.");

    throw new ApiError(message, status, error.response?.data?.errors ?? {});
  },
);

/** Laravel resource envelope: `{ data: T }`. */
interface Envelope<T> {
  data: T;
}

/** GET that unwraps Laravel's `{ data }` envelope. */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<Envelope<T>>(url, config);
  return response.data.data;
}

/** GET that returns the raw body (for paginated payloads with `meta`). */
export async function getRaw<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.post<Envelope<T>>(url, body, config);
  return response.data.data;
}

export async function put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.put<Envelope<T>>(url, body, config);
  return response.data.data;
}

export async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.patch<Envelope<T>>(url, body, config);
  return response.data.data;
}

export async function destroy<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<Envelope<T>>(url, config);
  return response.data?.data as T;
}
