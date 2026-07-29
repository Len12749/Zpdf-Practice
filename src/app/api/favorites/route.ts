import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { favorites, libraries, questions } from "@/db/schema";
import { jsonError, jsonOk, parseJson } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);

  const favs = await db
    .select({
      favoriteId: favorites.id,
      questionId: favorites.questionId,
      createdAt: favorites.createdAt,
    })
    .from(favorites)
    .where(eq(favorites.userId, user.id));

  if (!favs.length) return jsonOk({ questions: [] });

  const qids = favs.map((f) => f.questionId);
  const qs = await db
    .select({
      question: questions,
      libraryName: libraries.name,
      libraryId: libraries.id,
    })
    .from(questions)
    .innerJoin(libraries, eq(questions.libraryId, libraries.id))
    .where(inArray(questions.id, qids));

  return jsonOk({
    questions: qs.map((r) => ({
      ...r.question,
      libraryId: r.libraryId,
      libraryName: r.libraryName,
      favorited: true,
    })),
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const body = await parseJson<{ questionId?: string }>(req);
  const questionId = body?.questionId;
  if (!questionId) return jsonError("缺少 questionId");

  const [q] = await db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);
  if (!q) return jsonError("题目不存在", 404);

  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(
      and(eq(favorites.userId, user.id), eq(favorites.questionId, questionId)),
    )
    .limit(1);
  if (existing.length) return jsonOk({ favorited: true });

  await db.insert(favorites).values({
    userId: user.id,
    questionId,
  });
  return jsonOk({ favorited: true });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const body = await parseJson<{ questionId?: string }>(req);
  const questionId = body?.questionId;
  if (!questionId) return jsonError("缺少 questionId");

  await db
    .delete(favorites)
    .where(
      and(eq(favorites.userId, user.id), eq(favorites.questionId, questionId)),
    );
  return jsonOk({ favorited: false });
}
