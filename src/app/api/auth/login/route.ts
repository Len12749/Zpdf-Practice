import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk, parseJson } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  const body = await parseJson<{ account?: string; password?: string }>(req);
  const account = body?.account?.trim() ?? "";
  const password = body?.password ?? "";
  if (!account || !password) return jsonError("请输入账号和密码");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.account, account))
    .limit(1);
  if (!user) return jsonError("账号或密码错误", 401);

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return jsonError("账号或密码错误", 401);

  const token = await createSessionToken({
    sub: user.id,
    account: user.account,
  });
  await setSessionCookie(token);

  return jsonOk({
    user: {
      id: user.id,
      account: user.account,
      email: user.email,
      speedTickets: user.speedTickets,
    },
  });
}
