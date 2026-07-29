"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/client-api";

export type AuthUser = {
  id: string;
  account: string;
  email: string;
  speedTickets: number;
};

type AuthContextValue = {
  loading: boolean;
  isLoggedIn: boolean;
  user: AuthUser | null;
  checkedDays: Set<string>;
  checkedInToday: boolean;
  streak: number;
  speedTickets: number;
  refresh: () => Promise<void>;
  login: (account: string, password: string) => Promise<void>;
  register: (
    account: string,
    password: string,
    email: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkIn: () => Promise<{ ok: boolean; message: string; earnedTicket: boolean }>;
  updateEmail: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkedDays, setCheckedDays] = useState<Set<string>>(new Set());
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [streak, setStreak] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{
        user: AuthUser | null;
        checkIn?: {
          days: string[];
          streak: number;
          checkedInToday: boolean;
        };
      }>("/api/auth/me");
      setUser(data.user);
      if (data.user && data.checkIn) {
        setCheckedDays(new Set(data.checkIn.days));
        setCheckedInToday(data.checkIn.checkedInToday);
        setStreak(data.checkIn.streak);
      } else {
        setCheckedDays(new Set());
        setCheckedInToday(false);
        setStreak(0);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (account: string, password: string) => {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ account, password }),
      });
      await refresh();
    },
    [refresh],
  );

  const register = useCallback(
    async (account: string, password: string, email: string) => {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ account, password, email }),
      });
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCheckedDays(new Set());
    setCheckedInToday(false);
    setStreak(0);
  }, []);

  const checkIn = useCallback(async () => {
    const data = await api<{
      ok: boolean;
      message: string;
      earnedTicket: boolean;
      streak: number;
      days: string[];
      speedTickets: number;
      checkedInToday: boolean;
    }>("/api/check-in", { method: "POST" });
    setCheckedDays(new Set(data.days));
    setStreak(data.streak);
    setCheckedInToday(data.checkedInToday);
    setUser((u) =>
      u ? { ...u, speedTickets: data.speedTickets } : u,
    );
    return {
      ok: data.ok,
      message: data.message,
      earnedTicket: data.earnedTicket,
    };
  }, []);

  const updateEmail = useCallback(
    async (email: string) => {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ email }),
      });
      setUser((u) => (u ? { ...u, email } : u));
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      isLoggedIn: !!user,
      user,
      checkedDays,
      checkedInToday,
      streak,
      speedTickets: user?.speedTickets ?? 0,
      refresh,
      login,
      register,
      logout,
      checkIn,
      updateEmail,
    }),
    [
      loading,
      user,
      checkedDays,
      checkedInToday,
      streak,
      refresh,
      login,
      register,
      logout,
      checkIn,
      updateEmail,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { todayKey } from "@/lib/check-in-client";
