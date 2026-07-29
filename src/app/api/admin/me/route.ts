import { jsonError, jsonOk } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError("未登录管理后台", 401);
  return jsonOk({ account: session.account });
}
