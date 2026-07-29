import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { libraries, questions } from "@/db/schema";
import { jsonError, jsonOk, parseJson } from "@/lib/api";
import { abortAndCleanupLibrary } from "@/lib/extract-job";
import { getSessionUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

async function ownedLibrary(userId: string, id: string) {
  const [lib] = await db
    .select()
    .from(libraries)
    .where(and(eq(libraries.id, id), eq(libraries.userId, userId)))
    .limit(1);
  return lib ?? null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const { id } = await ctx.params;
  const lib = await ownedLibrary(user.id, id);
  if (!lib) return jsonError("题库不存在", 404);

  if (lib.status === "importing" || lib.status === "failed") {
    return jsonOk({
      library: serializeLib(lib),
      questions: [],
      locked: lib.status === "importing",
    });
  }

  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.libraryId, id))
    .orderBy(asc(questions.sortOrder));

  return jsonOk({
    library: serializeLib(lib),
    questions: qs,
    locked: false,
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const { id } = await ctx.params;
  const lib = await ownedLibrary(user.id, id);
  if (!lib) return jsonError("题库不存在", 404);
  if (lib.status === "importing") return jsonError("导入中不可修改", 409);

  const body = await parseJson<{ name?: string }>(req);
  const name = body?.name?.trim();
  if (!name) return jsonError("名称不能为空");
  await db
    .update(libraries)
    .set({ name, updatedAt: new Date() })
    .where(eq(libraries.id, id));
  return jsonOk({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const { id } = await ctx.params;
  const lib = await ownedLibrary(user.id, id);
  if (!lib) return jsonError("题库不存在", 404);

  // 允许删除进行中 / 失败任务：取消后台 AI 并释放临时文件，避免继续耗 API
  await abortAndCleanupLibrary(id);
  return jsonOk({ ok: true, cancelled: lib.status === "importing" });
}

function serializeLib(lib: typeof libraries.$inferSelect) {
  return {
    id: lib.id,
    name: lib.name,
    source: lib.source,
    status: lib.status,
    questionCount: lib.questionCount,
    createdAt: lib.createdAt,
    updatedAt: lib.updatedAt,
    importProgress: {
      completed: lib.importCompleted,
      total: lib.importTotal,
      pageCount: lib.importPageCount,
      phaseLabel: lib.importPhaseLabel ?? "",
      accelerated: lib.importAccelerated,
      error: lib.importError,
    },
  };
}
