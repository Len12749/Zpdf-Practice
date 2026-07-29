import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { libraries, questions } from "@/db/schema";
import { jsonError, jsonOk, parseJson } from "@/lib/api";
import { inferQuestionType } from "@/lib/question-type";
import { getSessionUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);
  const { id: libraryId } = await ctx.params;

  const [lib] = await db
    .select()
    .from(libraries)
    .where(and(eq(libraries.id, libraryId), eq(libraries.userId, user.id)))
    .limit(1);
  if (!lib) return jsonError("题库不存在", 404);
  if (lib.status === "importing") return jsonError("导入中不可编辑", 409);

  const body = await parseJson<{
    stem?: string;
    options?: { key: string; text: string }[];
    answer?: string[];
    explanation?: string;
    type?: "single" | "multiple";
  }>(req);

  const stem = body?.stem?.trim() ?? "";
  const options = body?.options ?? [];
  const answer = body?.answer ?? [];
  const explanation = body?.explanation?.trim() ?? "";
  if (!stem || options.length < 2) return jsonError("题干和选项不完整");
  if (!answer.length) return jsonError("请填写答案");

  const [{ c }] = await db
    .select({ c: count() })
    .from(questions)
    .where(eq(questions.libraryId, libraryId));

  const qid = crypto.randomUUID();
  const type = inferQuestionType(answer);

  await db.insert(questions).values({
    id: qid,
    libraryId,
    sortOrder: Number(c),
    stem,
    options,
    answer,
    explanation,
    type,
    aiGeneratedAnswer: false,
    aiGeneratedExplanation: false,
  });
  await db
    .update(libraries)
    .set({ questionCount: Number(c) + 1, updatedAt: new Date() })
    .where(eq(libraries.id, libraryId));

  return jsonOk({ id: qid });
}
