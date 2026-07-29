import { jsonError, jsonOk, parseJson } from "@/lib/api";
import {
  checkAdminLoginAllowed,
  createAdminToken,
  delayLoginMin,
  getClientIp,
  recordAdminLoginFail,
  recordAdminLoginSuccess,
  setAdminCookie,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await parseJson<{ account?: string; password?: string }>(req);
  const account = String(body?.account ?? "").trim();
  const password = String(body?.password ?? "");

  if (!account || !password) {
    return jsonError("请输入账号和密码");
  }

  const ip = getClientIp(req);
  const gate = checkAdminLoginAllowed(ip, account);
  if (!gate.ok) {
    return jsonError(gate.error || "暂时无法登录", 429);
  }

  // 固定最小耗时，削弱时序与暴力尝试速度
  const started = Date.now();
  const ok = verifyAdminCredentials(account, password);
  await delayLoginMin();
  const elapsed = Date.now() - started;
  if (elapsed < 450) {
    await new Promise((r) => setTimeout(r, 450 - elapsed));
  }

  if (!ok) {
    recordAdminLoginFail(ip, account);
    return jsonError("账号或密码错误", 401);
  }

  recordAdminLoginSuccess(ip, account);
  const token = await createAdminToken();
  await setAdminCookie(token);
  return jsonOk({ ok: true, account });
}
