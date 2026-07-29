import { jsonOk } from "@/lib/api";
import { clearAdminCookie } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  await clearAdminCookie();
  return jsonOk({ ok: true });
}
