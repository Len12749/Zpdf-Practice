import { count, eq } from "drizzle-orm";
import Papa from "papaparse";
import { db } from "@/db";
import { libraries, questions } from "@/db/schema";
import { jsonError, jsonOk } from "@/lib/api";
import { env } from "@/lib/env";
import { createGeminiPool, completeAnswerExplanation } from "@/lib/gemini";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 300;

function parseOptions(raw: string): { key: string; text: string }[] {
  // 支持 A.xxx|B.xxx 或 A|xxx||B|yyy
  const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
  const opts: { key: string; text: string }[] = [];
  for (const p of parts) {
    const m = p.match(/^([A-Za-z])[\.\:、\s]+(.+)$/);
    if (m) {
      opts.push({ key: m[1].toUpperCase(), text: m[2].trim() });
    } else if (opts.length < 26) {
      opts.push({
        key: String.fromCharCode(65 + opts.length),
        text: p,
      });
    }
  }
  return opts;
}

function parseAnswer(raw: string): string[] {
  return raw
    .split(/[;；,，\s]+/)
    .map((s) => s.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1))
    .filter(Boolean);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const file = form.get("file");
  if (!name) return jsonError("请填写题库名称");
  if (!(file instanceof File)) return jsonError("请上传 CSV 文件");

  const [{ c }] = await db
    .select({ c: count() })
    .from(libraries)
    .where(eq(libraries.userId, user.id));
  if (Number(c) >= env.libraryLimit) {
    return jsonError(`最多创建 ${env.libraryLimit} 个题库`);
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    return jsonError(`CSV 解析失败: ${parsed.errors[0]?.message}`);
  }

  const libraryId = crypto.randomUUID();
  await db.insert(libraries).values({
    id: libraryId,
    userId: user.id,
    name,
    source: "csv",
    status: "importing",
    importPhaseLabel: "解析 CSV…",
    importTotal: parsed.data.length || 1,
    importCompleted: 0,
  });

  try {
    const pool = createGeminiPool(false);
    const rows: Array<{
      libraryId: string;
      sortOrder: number;
      stem: string;
      options: { key: string; text: string }[];
      answer: string[];
      explanation: string;
      type: "single" | "multiple";
      aiGeneratedAnswer: boolean;
      aiGeneratedExplanation: boolean;
    }> = [];

    let i = 0;
    for (const row of parsed.data) {
      const stem = (row["题干"] ?? row.stem ?? "").trim();
      const optRaw = (row["选项"] ?? row.options ?? "").trim();
      const ansRaw = (row["答案"] ?? row.answer ?? "").trim();
      const explRaw = (row["解析"] ?? row.explanation ?? "").trim();
      if (!stem || !optRaw) continue;
      const options = parseOptions(optRaw);
      if (options.length < 2) continue;

      const paperAnswer = parseAnswer(ansRaw);
      const paperExpl = explRaw.trim();
      const filled = await pool.runLow(() =>
        completeAnswerExplanation(stem, options, paperAnswer, paperExpl, {
          answerOnPaper: paperAnswer.length > 0,
          explanationOnPaper: paperExpl.length > 0,
        }),
      );
      if (!filled.answer.length) continue;

      rows.push({
        libraryId,
        sortOrder: i++,
        stem,
        options,
        answer: filled.answer,
        explanation: filled.explanation,
        type: filled.type,
        aiGeneratedAnswer: filled.aiGeneratedAnswer,
        aiGeneratedExplanation: filled.aiGeneratedExplanation,
      });

      await db
        .update(libraries)
        .set({
          importCompleted: i,
          importPhaseLabel: `已处理 ${i} 题…`,
        })
        .where(eq(libraries.id, libraryId));
    }

    if (rows.length) await db.insert(questions).values(rows);
    await db
      .update(libraries)
      .set({
        status: "ready",
        questionCount: rows.length,
        importCompleted: rows.length,
        importTotal: Math.max(rows.length, 1),
        importPhaseLabel: "导入完成",
      })
      .where(eq(libraries.id, libraryId));

    return jsonOk({ id: libraryId, questionCount: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db
      .update(libraries)
      .set({ status: "failed", importError: msg })
      .where(eq(libraries.id, libraryId));
    return jsonError(msg, 500);
  }
}
