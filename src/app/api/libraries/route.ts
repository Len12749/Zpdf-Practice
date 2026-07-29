import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { libraries } from "@/db/schema";
import { jsonError, jsonOk, parseJson } from "@/lib/api";
import { env } from "@/lib/env";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);

  const rows = await db
    .select()
    .from(libraries)
    .where(eq(libraries.userId, user.id))
    .orderBy(desc(libraries.updatedAt));

  return jsonOk({
    libraries: rows.map((r) => ({
      id: r.id,
      name: r.name,
      source: r.source,
      status: r.status,
      questionCount: r.questionCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      importProgress:
        r.status === "importing" || r.status === "failed"
          ? {
              completed: r.importCompleted,
              total: r.importTotal,
              pageCount: r.importPageCount,
              phaseLabel: r.importPhaseLabel ?? "",
              accelerated: r.importAccelerated,
              error: r.importError,
            }
          : null,
    })),
    limit: env.libraryLimit,
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);

  const body = await parseJson<{ name?: string }>(req);
  const name = body?.name?.trim() ?? "";
  if (!name) return jsonError("请填写题库名称");

  const [{ c }] = await db
    .select({ c: count() })
    .from(libraries)
    .where(eq(libraries.userId, user.id));
  if (Number(c) >= env.libraryLimit) {
    return jsonError(`最多创建 ${env.libraryLimit} 个题库`, 400);
  }

  const id = crypto.randomUUID();
  await db.insert(libraries).values({
    id,
    userId: user.id,
    name,
    source: "upload",
    status: "ready",
  });

  return jsonOk({ id, name });
}
