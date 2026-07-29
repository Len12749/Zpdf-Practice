import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { libraries, questions } from "@/db/schema";
import { jsonError, jsonOk, parseJson } from "@/lib/api";
import { inferQuestionType } from "@/lib/question-type";
import { getSessionUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string; qid: string }> };

async function getOwned(userId: string, libraryId: string, qid: string) {
  const [lib] = await db
    .select()
    .from(libraries)
    .where(and(eq(libraries.id, libraryId), eq(libraries.userId, userId)))
    .limit(1);
  if (!lib) return { lib: null, q: null };
  const [q] = await db
    .select()
    .from(questions)
    .where(and(eq(questions.id, qid), eq(questions.libraryId, libraryId)))
    .limit(1);
  return { lib, q: q ?? null };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const { id: libraryId, qid } = await ctx.params;
  const { lib, q } = await getOwned(user.id, libraryId, qid);
  if (!lib || !q) return jsonError("题目不存在", 404);
  if (lib.status === "importing") return jsonError("导入中不可编辑", 409);

  const body = await parseJson<{
    stem?: string;
    options?: { key: string; text: string }[];
    answer?: string[];
    explanation?: string;
    type?: "single" | "multiple";
  }>(req);

  const stem = body?.stem?.trim() ?? q.stem;
  const options = body?.options ?? q.options;
  const answer = body?.answer ?? q.answer;
  const explanation =
    body?.explanation !== undefined
      ? body.explanation.trim()
      : q.explanation;
  if (!stem || options.length < 2) return jsonError("题干和选项不完整");

  const answerChanged =
    body?.answer !== undefined &&
    JSON.stringify(body.answer) !== JSON.stringify(q.answer);
  const explChanged =
    body?.explanation !== undefined &&
    body.explanation.trim() !== q.explanation;

  const type = inferQuestionType(answer);

  await db
    .update(questions)
    .set({
      stem,
      options,
      answer,
      explanation,
      type,
      aiGeneratedAnswer: answerChanged ? false : q.aiGeneratedAnswer,
      aiGeneratedExplanation: explChanged ? false : q.aiGeneratedExplanation,
      updatedAt: new Date(),
    })
    .where(eq(questions.id, qid));

  return jsonOk({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const { id: libraryId, qid } = await ctx.params;
  const { lib, q } = await getOwned(user.id, libraryId, qid);
  if (!lib || !q) return jsonError("题目不存在", 404);
  if (lib.status === "importing") return jsonError("导入中不可编辑", 409);

  await db.delete(questions).where(eq(questions.id, qid));
  const [{ c }] = await db
    .select({ c: count() })
    .from(questions)
    .where(eq(questions.libraryId, libraryId));
  await db
    .update(libraries)
    .set({ questionCount: Number(c), updatedAt: new Date() })
    .where(eq(libraries.id, libraryId));

  return jsonOk({ ok: true });
}
