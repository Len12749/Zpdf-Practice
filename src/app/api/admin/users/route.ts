import { jsonError, jsonOk } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-auth";
import { listUsersForAdmin } from "@/lib/admin-users";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError("未登录管理后台", 401);
  const users = await listUsersForAdmin();
  return jsonOk({ users });
}
