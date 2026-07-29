import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { libraries, questions, wrongQuestions } from "@/db/schema";
import { jsonError, jsonOk, parseJson } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const url = new URL(req.url);
  const libraryId = url.searchParams.get("libraryId");

  const cond = libraryId
    ? and(
        eq(wrongQuestions.userId, user.id),
        eq(wrongQuestions.libraryId, libraryId),
      )
    : eq(wrongQuestions.userId, user.id);

  const rows = await db
    .select({
      wrong: wrongQuestions,
      question: questions,
      libraryName: libraries.name,
    })
    .from(wrongQuestions)
    .innerJoin(questions, eq(wrongQuestions.questionId, questions.id))
    .innerJoin(libraries, eq(wrongQuestions.libraryId, libraries.id))
    .where(cond);

  return jsonOk({
    questions: rows.map((r) => ({
      ...r.question,
      wrongCount: r.wrong.wrongCount,
      libraryId: r.wrong.libraryId,
      libraryName: r.libraryName,
    })),
  });
}

/** 答错记入 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const body = await parseJson<{
    questionId?: string;
    libraryId?: string;
  }>(req);
  if (!body?.questionId || !body.libraryId) {
    return jsonError("缺少参数");
  }

  const [existing] = await db
    .select()
    .from(wrongQuestions)
    .where(
      and(
        eq(wrongQuestions.userId, user.id),
        eq(wrongQuestions.questionId, body.questionId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(wrongQuestions)
      .set({
        wrongCount: existing.wrongCount + 1,
        lastWrongAt: new Date(),
      })
      .where(eq(wrongQuestions.id, existing.id));
  } else {
    await db.insert(wrongQuestions).values({
      userId: user.id,
      questionId: body.questionId,
      libraryId: body.libraryId,
      wrongCount: 1,
    });
  }
  return jsonOk({ ok: true });
}

/** 我已学会 */
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const body = await parseJson<{ questionId?: string }>(req);
  if (!body?.questionId) return jsonError("缺少 questionId");

  await db
    .delete(wrongQuestions)
    .where(
      and(
        eq(wrongQuestions.userId, user.id),
        eq(wrongQuestions.questionId, body.questionId),
      ),
    );
  return jsonOk({ ok: true });
}
