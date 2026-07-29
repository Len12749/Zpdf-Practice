import { jsonError, jsonOk, parseJson } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-auth";
import {
  deleteUserCompletely,
  setUserSpeedTickets,
} from "@/lib/admin-users";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getAdminSession();
  if (!session) return jsonError("未登录管理后台", 401);

  const { id } = await ctx.params;
  const body = await parseJson<{ speedTickets?: number }>(req);
  if (
    body?.speedTickets === undefined ||
    typeof body.speedTickets !== "number" ||
    !Number.isFinite(body.speedTickets)
  ) {
    return jsonError("请提供有效的加速券数量");
  }

  const n = await setUserSpeedTickets(id, body.speedTickets);
  if (n === null) return jsonError("用户不存在", 404);
  return jsonOk({ ok: true, speedTickets: n });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getAdminSession();
  if (!session) return jsonError("未登录管理后台", 401);

  const { id } = await ctx.params;
  const result = await deleteUserCompletely(id);
  if (!result) return jsonError("用户不存在", 404);
  return jsonOk({ ok: true, deleted: result });
}
