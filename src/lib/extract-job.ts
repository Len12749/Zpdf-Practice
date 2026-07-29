import { eq } from "drizzle-orm";
import { db } from "@/db";
import { libraries, questions } from "@/db/schema";
import {
  completeAnswerExplanation,
  createGeminiPool,
  extractBlocksFromPage,
  mergeBlockContent,
  shouldMergeBlocks,
  type ExtractedBlock,
} from "@/lib/gemini";
import { cleanupLibraryFiles } from "@/lib/storage";

const running = new Set<string>();
/** 用户删除/取消后，后台任务应尽快停止，避免继续打 API */
const cancelled = new Set<string>();

export function isJobRunning(libraryId: string) {
  return running.has(libraryId);
}

export function cancelExtractJob(libraryId: string) {
  cancelled.add(libraryId);
  running.delete(libraryId);
}

function isCancelled(libraryId: string) {
  return cancelled.has(libraryId);
}

class JobCancelledError extends Error {
  constructor() {
    super("任务已取消");
    this.name = "JobCancelledError";
  }
}

function throwIfCancelled(libraryId: string) {
  if (isCancelled(libraryId)) throw new JobCancelledError();
}

async function setProgress(
  libraryId: string,
  patch: Partial<{
    importCompleted: number;
    importTotal: number;
    importPageCount: number;
    importPhaseLabel: string | null;
    status: "ready" | "importing" | "failed";
    importError: string | null;
    questionCount: number;
  }>,
) {
  if (isCancelled(libraryId)) return;
  await db
    .update(libraries)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(libraries.id, libraryId));
}

export async function runExtractJob(
  libraryId: string,
  pagePaths: string[],
  accelerated: boolean,
) {
  if (running.has(libraryId)) return;
  cancelled.delete(libraryId);
  running.add(libraryId);

  const pageCount = pagePaths.length;
  const mergeCount = Math.max(0, pageCount - 1);
  const total = pageCount + mergeCount;
  let completed = 0;

  const bump = async (label: string) => {
    completed += 1;
    await setProgress(libraryId, {
      importCompleted: completed,
      importPhaseLabel: label,
    });
  };

  try {
    await setProgress(libraryId, {
      status: "importing",
      importCompleted: 0,
      importTotal: total,
      importPageCount: pageCount,
      importPhaseLabel: "调度提取任务…",
      importError: null,
    });

    const pool = createGeminiPool(accelerated);
    const pageBlocks: ExtractedBlock[][] = new Array(pageCount);
    const extractDone = new Array(pageCount).fill(false) as boolean[];
    const mergeScheduled = new Array(mergeCount).fill(false) as boolean[];
    const mergePromises: Promise<void>[] = [];

    /**
     * 相邻两页都提取完后，立刻把跨页判断丢进低优先队列。
     * 高优先提取占满时它会等；提取快结束、池子有空槽时自动填入。
     */
    const scheduleMerges = () => {
      for (let i = 0; i < mergeCount; i++) {
        if (mergeScheduled[i]) continue;
        if (!extractDone[i] || !extractDone[i + 1]) continue;
        mergeScheduled[i] = true;
        const pair = i;
        mergePromises.push(
          pool.runLow(async () => {
            throwIfCancelled(libraryId);
            const prevPage = pageBlocks[pair] ?? [];
            const nextPage = pageBlocks[pair + 1] ?? [];
            if (prevPage.length && nextPage.length) {
              const prev = prevPage[prevPage.length - 1];
              const next = nextPage[0];
              const merge = await shouldMergeBlocks(prev, next);
              throwIfCancelled(libraryId);
              if (merge) {
                const merged = mergeBlockContent(prev, next);
                prevPage[prevPage.length - 1] = merged;
                nextPage.shift();
              }
            }
            await bump(
              `跨页判断 ${pair + 1}/${mergeCount}（与提取并行，提取优先）`,
            );
          }),
        );
      }
    };

    // 全部页提取：高优先，立即入队（并发由池控制）
    const extractPromises = pagePaths.map((path, i) =>
      pool.runHigh(async () => {
        throwIfCancelled(libraryId);
        const blocks = await extractBlocksFromPage(path, i);
        throwIfCancelled(libraryId);
        pageBlocks[i] = blocks;
        extractDone[i] = true;
        await bump(`已提取第 ${i + 1}/${pageCount} 页`);
        scheduleMerges();
      }),
    );

    await Promise.all(extractPromises);
    // 兜底：确保所有可判跨页都已入队
    scheduleMerges();
    await Promise.all(mergePromises);

    throwIfCancelled(libraryId);
    await setProgress(libraryId, {
      importPhaseLabel: "整理题目并补全缺失答案/解析…",
    });

    const flat = pageBlocks.flatMap((b) => b ?? []);
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

    // 补全也走低优先并行，不与提取抢（此时提取已结束）
    const completeResults = await Promise.all(
      flat.map((block) =>
        pool.runLow(async () => {
          throwIfCancelled(libraryId);
          if (!block.stem || block.options.length < 2) return null;
          const filled = await completeAnswerExplanation(
            block.stem,
            block.options,
            block.answer,
            block.explanation,
            {
              answerOnPaper: block.answerOnPaper,
              explanationOnPaper: block.explanationOnPaper,
            },
          );
          throwIfCancelled(libraryId);
          if (!filled.answer.length) return null;
          return {
            stem: block.stem,
            options: block.options,
            answer: filled.answer,
            explanation: filled.explanation,
            type: filled.type,
            aiGeneratedAnswer: filled.aiGeneratedAnswer,
            aiGeneratedExplanation: filled.aiGeneratedExplanation,
          };
        }),
      ),
    );

    let order = 0;
    for (const r of completeResults) {
      if (!r) continue;
      rows.push({
        libraryId,
        sortOrder: order++,
        ...r,
      });
    }

    throwIfCancelled(libraryId);
    await db.delete(questions).where(eq(questions.libraryId, libraryId));

    if (!rows.length) {
      // 全程未识别到选择题：明确失败原因，避免「空题库却显示成功」
      await setProgress(libraryId, {
        status: "failed",
        questionCount: 0,
        importCompleted: total,
        importPhaseLabel: "未找到选择题",
        importError:
          "未从上传页面中识别到选择题（仅支持带 A/B/C… 选项的单选/多选）。请确认卷面含选择题后重试，或改用 CSV 导入。",
      });
      return;
    }

    await db.insert(questions).values(rows);

    await setProgress(libraryId, {
      status: "ready",
      questionCount: rows.length,
      importCompleted: total,
      importPhaseLabel: "提取完成",
      importError: null,
    });
  } catch (e) {
    if (e instanceof JobCancelledError || isCancelled(libraryId)) {
      return;
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (!isCancelled(libraryId)) {
      await setProgress(libraryId, {
        status: "failed",
        importPhaseLabel: "提取失败",
        importError: msg,
      });
    }
  } finally {
    running.delete(libraryId);
  }
}

/** 删除题库时：取消任务 + 删库 + 清临时文件 */
export async function abortAndCleanupLibrary(libraryId: string) {
  cancelExtractJob(libraryId);
  try {
    await db.delete(libraries).where(eq(libraries.id, libraryId));
  } catch {
    /* 可能已删 */
  }
  await cleanupLibraryFiles(libraryId);
  cancelled.delete(libraryId);
}
