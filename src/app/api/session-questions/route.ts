import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  favorites,
  libraries,
  questions,
  wrongQuestions,
} from "@/db/schema";
import { jsonError, jsonOk } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

/** 刷题/背题取题 */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);

  const url = new URL(req.url);
  const libraryId = url.searchParams.get("libraryId");
  const order = url.searchParams.get("order") ?? "asc"; // asc|desc|shuffle
  const wrongOnly = url.searchParams.get("wrongOnly") === "1";

  if (!libraryId) return jsonError("请选择题库");

  const [lib] = await db
    .select()
    .from(libraries)
    .where(and(eq(libraries.id, libraryId), eq(libraries.userId, user.id)))
    .limit(1);
  if (!lib) return jsonError("题库不存在", 404);
  if (lib.status === "importing") return jsonError("题库导入中", 409);

  let qs = await db
    .select()
    .from(questions)
    .where(eq(questions.libraryId, libraryId))
    .orderBy(asc(questions.sortOrder));

  if (wrongOnly) {
    const wrongs = await db
      .select({ questionId: wrongQuestions.questionId, wrongCount: wrongQuestions.wrongCount })
      .from(wrongQuestions)
      .where(
        and(
          eq(wrongQuestions.userId, user.id),
          eq(wrongQuestions.libraryId, libraryId),
        ),
      );
    const map = new Map(wrongs.map((w) => [w.questionId, w.wrongCount]));
    qs = qs
      .filter((q) => map.has(q.id))
      .map((q) => ({ ...q, wrongCount: map.get(q.id) ?? 0 }));
  }

  const favs = await db
    .select({ questionId: favorites.questionId })
    .from(favorites)
    .where(eq(favorites.userId, user.id));
  const favSet = new Set(favs.map((f) => f.questionId));

  let list = qs.map((q) => ({
    ...q,
    favorited: favSet.has(q.id),
    wrongCount: "wrongCount" in q ? (q as { wrongCount?: number }).wrongCount ?? 0 : 0,
  }));

  if (order === "desc") list = [...list].reverse();
  if (order === "shuffle") {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }

  return jsonOk({
    library: { id: lib.id, name: lib.name },
    questions: list,
  });
}
