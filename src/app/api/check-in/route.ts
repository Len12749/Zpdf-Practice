import { jsonError, jsonOk } from "@/lib/api";
import {
  calcStreak,
  listCheckInDays,
  performCheckIn,
  todayKey,
} from "@/lib/check-in";
import { getSessionUser } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const days = await listCheckInDays(user.id);
  const daySet = new Set(days);
  return jsonOk({
    days,
    streak: calcStreak(daySet),
    checkedInToday: daySet.has(todayKey()),
    speedTickets: user.speedTickets,
  });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const result = await performCheckIn(user.id);
  const [fresh] = await db
    .select({ speedTickets: users.speedTickets })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  return jsonOk({
    ...result,
    speedTickets: fresh?.speedTickets ?? user.speedTickets,
    checkedInToday: true,
  });
}
