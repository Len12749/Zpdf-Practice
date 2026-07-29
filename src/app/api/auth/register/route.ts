import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk, parseJson } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  const body = await parseJson<{
    account?: string;
    password?: string;
    email?: string;
  }>(req);
  const account = body?.account?.trim() ?? "";
  const password = body?.password ?? "";
  const email = body?.email?.trim() ?? "";

  if (!account || account.length < 2 || account.length > 64) {
    return jsonError("账号长度需 2-64");
  }
  if (!password || password.length < 6) {
    return jsonError("密码至少 6 位");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("请填写有效联系邮箱");
  }

  const exists = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.account, account))
    .limit(1);
  if (exists.length) return jsonError("账号已存在", 409);

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await db.insert(users).values({
    id,
    account,
    passwordHash,
    email,
    speedTickets: 0,
  });

  const token = await createSessionToken({ sub: id, account });
  await setSessionCookie(token);

  return jsonOk({
    user: { id, account, email, speedTickets: 0 },
  });
}
