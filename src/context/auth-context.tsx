/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { UNAUTHORIZED_EVENT } from "@/api/client";
import { authRepository } from "@/api/repositories";
import { queryClient } from "@/lib/query-client";
import { tokenStorage } from "@/lib/storage";
import type { LoginPayload, User } from "@/types";

type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  /** Replace the cached user after profile/avatar updates. */
  setUser: (user: User) => void;
  hasRole: (role: string) => boolean;
  /** Spatie permission check, e.g. can("courses.view"). */
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? "loading" : "guest"));

  // Bootstrap the session from a stored token.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    let cancelled = false;
    authRepository
      .me()
      .then((me) => {
        if (cancelled) return;
        setUserState(me);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        tokenStorage.clear();
        setUserState(null);
        setStatus("guest");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A 401 anywhere in the app resets the session.
  useEffect(() => {
    const onUnauthorized = () => {
      setUserState(null);
      setStatus("guest");
      queryClient.clear();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { token, user: me } = await authRepository.login(payload);
    tokenStorage.set(token, payload.remember);
    setUserState(me);
    setStatus("authenticated");
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authRepository.logout();
    } catch {
      // Even if the server call fails, drop the local session.
    }
    tokenStorage.clear();
    setUserState(null);
    setStatus("guest");
    queryClient.clear();
  }, []);

  const setUser = useCallback((next: User) => {
    setUserState(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login,
      logout,
      setUser,
      hasRole: (role) => user?.roles.includes(role) ?? false,
      can: (permission) => user?.permissions.includes(permission) ?? false,
    }),
    [user, status, login, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
