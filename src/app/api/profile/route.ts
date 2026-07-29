import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk, parseJson } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const body = await parseJson<{ email?: string }>(req);
  const email = body?.email?.trim() ?? "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("请填写有效邮箱");
  }
  await db.update(users).set({ email }).where(eq(users.id, user.id));
  return jsonOk({ email });
}
