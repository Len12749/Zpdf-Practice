import { jsonOk } from "@/lib/api";
import { calcStreak, listCheckInDays, todayKey } from "@/lib/check-in";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonOk({ user: null });

  const days = await listCheckInDays(user.id);
  const daySet = new Set(days);
  const streak = calcStreak(daySet);
  const checkedInToday = daySet.has(todayKey());

  return jsonOk({
    user: {
      id: user.id,
      account: user.account,
      email: user.email,
      speedTickets: user.speedTickets,
    },
    checkIn: {
      days,
      streak,
      checkedInToday,
    },
  });
}
