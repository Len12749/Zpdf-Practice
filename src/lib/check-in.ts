import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { checkIns, users } from "@/db/schema";

export function todayKey(d = new Date()) {
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

export async function listCheckInDays(userId: string) {
  const rows = await db
    .select({ day: checkIns.day })
    .from(checkIns)
    .where(eq(checkIns.userId, userId))
    .orderBy(desc(checkIns.day));
  return rows.map((r) => r.day);
}

export function calcStreak(days: Set<string>, from = new Date()) {
  let streak = 0;
  let cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (!days.has(todayKey(cursor))) {
    cursor = addDays(cursor, -1);
  }
  while (days.has(todayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export async function performCheckIn(userId: string) {
  const day = todayKey();
  const existing = await db
    .select({ id: checkIns.id })
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), eq(checkIns.day, day)))
    .limit(1);
  if (existing.length) {
    const days = new Set(await listCheckInDays(userId));
    return {
      ok: false as const,
      earnedTicket: false,
      streak: calcStreak(days),
      message: "今日已签到",
      days: [...days],
    };
  }

  await db.insert(checkIns).values({ userId, day });
  const days = new Set(await listCheckInDays(userId));
  const streak = calcStreak(days);
  const earnedTicket = streak > 0 && streak % 3 === 0;
  if (earnedTicket) {
    const [u] = await db
      .select({ speedTickets: users.speedTickets })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    await db
      .update(users)
      .set({ speedTickets: (u?.speedTickets ?? 0) + 1 })
      .where(eq(users.id, userId));
  }

  return {
    ok: true as const,
    earnedTicket,
    streak,
    message: earnedTicket
      ? `签到成功！连续 ${streak} 天，获得 1 张加速券`
      : `签到成功！已连续 ${streak} 天`,
    days: [...days],
  };
}
