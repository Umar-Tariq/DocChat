"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, ApiError } from "@/lib/api";
import type { User } from "@/types";

const ACCESS_KEY = "docchat_access";
const REFRESH_KEY = "docchat_refresh";
const USER_KEY = "docchat_user";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persistSession(access: string, refresh: string, user: User) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAccess = localStorage.getItem(ACCESS_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedAccess && storedRefresh && storedUser) {
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
      setUser(JSON.parse(storedUser) as User);
    }
    setIsLoading(false);
  }, []);

  const getValidAccessToken = useCallback(async () => {
    if (accessToken) {
      return accessToken;
    }
    if (!refreshToken) {
      return null;
    }

    try {
      const tokens = await api.refresh(refreshToken);
      setAccessToken(tokens.access);
      setRefreshToken(tokens.refresh);
      localStorage.setItem(ACCESS_KEY, tokens.access);
      localStorage.setItem(REFRESH_KEY, tokens.refresh);
      return tokens.access;
    } catch {
      clearSession();
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      return null;
    }
  }, [accessToken, refreshToken]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password });
    persistSession(result.access, result.refresh, result.user);
    setAccessToken(result.access);
    setRefreshToken(result.refresh);
    setUser(result.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const result = await api.register({ email, password, name });
      persistSession(result.access, result.refresh, result.user);
      setAccessToken(result.access);
      setRefreshToken(result.refresh);
      setUser(result.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    if (accessToken && refreshToken) {
      try {
        await api.logout(refreshToken, accessToken);
      } catch (error) {
        if (!(error instanceof ApiError)) {
          throw error;
        }
      }
    }
    clearSession();
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }, [accessToken, refreshToken]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      login,
      register,
      logout,
      getValidAccessToken,
    }),
    [user, accessToken, isLoading, login, register, logout, getValidAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
