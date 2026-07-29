"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, delta: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d;
}

/** 演示：本月已有若干签到日（不含今天），连续 streak 从昨天往回算 */
function seedCheckedDays(): string[] {
  const now = new Date();
  const keys: string[] = [];
  // 昨天、前天已签，形成连续 2 天；再签今天 → 连续 3 天发券
  keys.push(todayKey(addDays(now, -1)));
  keys.push(todayKey(addDays(now, -2)));
  // 本月更早零星签到
  keys.push(todayKey(addDays(now, -5)));
  keys.push(todayKey(addDays(now, -8)));
  keys.push(todayKey(addDays(now, -12)));
  return [...new Set(keys)];
}

function calcStreak(days: Set<string>, from = new Date()): number {
  let streak = 0;
  let cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  // 若今天未签，从昨天开始计连续
  if (!days.has(todayKey(cursor))) {
    cursor = addDays(cursor, -1);
  }
  while (days.has(todayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

type AuthContextValue = {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  checkedDays: Set<string>;
  checkedInToday: boolean;
  streak: number;
  speedTickets: number;
  checkIn: () => { ok: boolean; earnedTicket: boolean; message: string };
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 演示默认未登录，便于看「无个人中心」；登录页一点即入
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkedDays, setCheckedDays] = useState<Set<string>>(
    () => new Set(seedCheckedDays()),
  );
  const [speedTickets, setSpeedTickets] = useState(1);

  const checkedInToday = checkedDays.has(todayKey());
  const streak = useMemo(() => calcStreak(checkedDays), [checkedDays]);

  const checkIn = useCallback(() => {
    const key = todayKey();
    if (checkedDays.has(key)) {
      return { ok: false, earnedTicket: false, message: "今日已签到" };
    }
    const next = new Set(checkedDays);
    next.add(key);
    const newStreak = calcStreak(next);
    // 每连续满 3 天发一张（3、6、9…）
    const earnedTicket = newStreak > 0 && newStreak % 3 === 0;
    setCheckedDays(next);
    if (earnedTicket) {
      setSpeedTickets((n) => n + 1);
    }
    return {
      ok: true,
      earnedTicket,
      message: earnedTicket
        ? `签到成功！连续 ${newStreak} 天，获得 1 张加速券`
        : `签到成功！已连续 ${newStreak} 天`,
    };
  }, [checkedDays]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn,
      login: () => setIsLoggedIn(true),
      logout: () => setIsLoggedIn(false),
      checkedDays,
      checkedInToday,
      streak,
      speedTickets,
      checkIn,
    }),
    [isLoggedIn, checkedDays, checkedInToday, streak, speedTickets, checkIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { todayKey };
