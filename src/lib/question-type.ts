/**
 * 单选/多选唯一标准：答案个数。
 * 1 个 → 单选；多于 1 个 → 多选（含 AI 补全答案）。
 */
export function inferQuestionType(
  answer: string[] | null | undefined,
): "single" | "multiple" {
  const n = Array.isArray(answer) ? answer.filter(Boolean).length : 0;
  return n > 1 ? "multiple" : "single";
}
