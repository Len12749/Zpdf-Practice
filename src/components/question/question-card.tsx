"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LatexText } from "@/components/math/latex-text";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { useFeedback } from "@/components/ui/feedback";
import { inferQuestionType } from "@/lib/question-type";
import {
  Heart,
  PencilSimple,
  Trash,
  Sparkle,
  Check,
  X,
} from "@phosphor-icons/react";
import { useState } from "react";

export type QuestionView = {
  id: string;
  stem: string;
  options: { key: string; text: string }[];
  answer: string[];
  explanation: string;
  type: "single" | "multiple";
  aiGeneratedAnswer?: boolean;
  aiGeneratedExplanation?: boolean;
  favorited?: boolean;
  wrongCount?: number;
};

export function QuestionCard({
  question,
  index,
  mode = "manage",
  showAnswer = false,
  libraryId,
  onDeleted,
  onUpdated,
  onWrong,
}: {
  question: QuestionView;
  index: number;
  mode?: "manage" | "practice" | "memorize";
  showAnswer?: boolean;
  libraryId?: string;
  onDeleted?: () => void;
  onUpdated?: () => void;
  onWrong?: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [favorited, setFavorited] = useState(!!question.favorited);
  const [revealed, setRevealed] = useState(showAnswer || mode === "memorize");
  const { toast, confirm } = useFeedback();
  const [editing, setEditing] = useState(false);
  const [stem, setStem] = useState(question.stem);
  const [explanation, setExplanation] = useState(question.explanation);
  const [answerStr, setAnswerStr] = useState(question.answer.join(""));

  const normalizeKey = (k: string) =>
    String(k)
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 1);

  const answerKeys = question.answer.map(normalizeKey).filter(Boolean);
  // 唯一标准：答案个数（含 AI 补全）
  const qType = inferQuestionType(answerKeys);

  const toggleOption = (key: string) => {
    if (mode !== "practice" || revealed) return;
    if (qType === "single") setSelected([key]);
    else
      setSelected((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
  };

  const isCorrectKey = (key: string) => answerKeys.includes(normalizeKey(key));

  /** 题库管理 / 背题 / 刷题已提交：高亮正确答案为绿色 */
  const showAnswerHighlight =
    mode === "manage" || mode === "memorize" || (mode === "practice" && revealed);

  const submitPractice = () => {
    setRevealed(true);
    const selectedNorm = selected.map(normalizeKey);
    const correct =
      selectedNorm.length === answerKeys.length &&
      selectedNorm.every((k) => answerKeys.includes(k));
    if (!correct && libraryId) {
      void api("/api/wrong", {
        method: "POST",
        body: JSON.stringify({
          questionId: question.id,
          libraryId,
        }),
      }).then(() => onWrong?.());
    }
  };

  const toggleFav = async () => {
    try {
      if (favorited) {
        await api("/api/favorites", {
          method: "DELETE",
          body: JSON.stringify({ questionId: question.id }),
        });
        setFavorited(false);
      } else {
        await api("/api/favorites", {
          method: "POST",
          body: JSON.stringify({ questionId: question.id }),
        });
        setFavorited(true);
      }
    } catch {
      /* ignore */
    }
  };

  const saveEdit = async () => {
    if (!libraryId) return;
    const answer = answerStr
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .split("")
      .filter(Boolean);
    await api(`/api/libraries/${libraryId}/questions/${question.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        stem,
        explanation,
        answer,
        type: inferQuestionType(answer),
      }),
    });
    setEditing(false);
    onUpdated?.();
  };

  return (
    <article className="rounded-[var(--radius)] border border-border bg-surface p-5 shadow-[var(--shadow)] md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted">#{index + 1}</span>
          <Badge tone={qType === "single" ? "neutral" : "accent"}>
            {qType === "single" ? "单选" : "多选"}
          </Badge>
          {/* MySQL tinyint 可能是 0/1，统一 Boolean */}
          {Boolean(question.aiGeneratedAnswer) &&
          Boolean(question.aiGeneratedExplanation) ? (
            <Badge tone="warning" className="gap-1">
              <Sparkle size={12} weight="fill" />
              答案与解析均为 AI 生成
            </Badge>
          ) : (
            <>
              {Boolean(question.aiGeneratedAnswer) && (
                <Badge tone="warning" className="gap-1">
                  <Sparkle size={12} weight="fill" />
                  答案 AI 生成
                </Badge>
              )}
              {Boolean(question.aiGeneratedExplanation) && (
                <Badge tone="warning" className="gap-1">
                  <Sparkle size={12} weight="fill" />
                  解析 AI 生成
                </Badge>
              )}
            </>
          )}
          {(question.wrongCount ?? 0) > 0 && mode !== "manage" && (
            <Badge tone="danger">错 {question.wrongCount} 次</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void toggleFav()}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              favorited
                ? "bg-red-500/10 text-danger"
                : "text-muted hover:bg-surface-muted",
            )}
            aria-label="收藏"
          >
            <Heart size={18} weight={favorited ? "fill" : "regular"} />
          </button>
          {mode === "manage" && libraryId && (
            <>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-muted"
                onClick={() => setEditing((v) => !v)}
                aria-label="编辑"
              >
                <PencilSimple size={18} />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-muted text-muted hover:border-danger/40 hover:bg-red-500/10 hover:text-danger"
                onClick={() => {
                  void (async () => {
                    const ok = await confirm({
                      title: "删除这道题？",
                      description: "删除后不可恢复。",
                      confirmLabel: "删除",
                      danger: true,
                    });
                    if (!ok) return;
                    try {
                      await api(
                        `/api/libraries/${libraryId}/questions/${question.id}`,
                        { method: "DELETE" },
                      );
                      toast("题目已删除", "success");
                      onDeleted?.();
                    } catch (e) {
                      toast(
                        e instanceof Error ? e.message : "删除失败",
                        "error",
                      );
                    }
                  })();
                }}
                aria-label="删除"
              >
                <Trash size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <Input
            label="题干"
            value={stem}
            onChange={(e) => setStem(e.target.value)}
          />
          <Input
            label="答案（如 A 或 AC）"
            value={answerStr}
            onChange={(e) => setAnswerStr(e.target.value)}
          />
          <label className="flex flex-col gap-2 text-sm font-medium">
            解析
            <textarea
              className="min-h-[80px] rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <Button size="sm" icon={<Check size={16} />} onClick={() => void saveEdit()}>
              保存
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<X size={16} />}
              onClick={() => setEditing(false)}
            >
              取消
            </Button>
          </div>
        </div>
      ) : (
        <LatexText className="text-[15px] leading-relaxed text-foreground md:text-base">
          {question.stem}
        </LatexText>
      )}

      {!editing && (
        <ul className="mt-4 grid gap-2">
          {question.options.map((opt) => {
            const isSelected = selected.includes(opt.key);
            const correct = isCorrectKey(opt.key);
            const showWrongPick =
              mode === "practice" && revealed && isSelected && !correct;
            return (
              <li key={opt.key}>
                <button
                  type="button"
                  onClick={() => toggleOption(opt.key)}
                  disabled={mode === "manage" || revealed || mode === "memorize"}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[var(--radius-sm)] border px-3.5 py-3 text-left text-sm transition-colors",
                    mode === "practice" &&
                      !revealed &&
                      "cursor-pointer hover:border-accent/40",
                    // 已选未提交
                    isSelected &&
                      !showAnswerHighlight &&
                      "border-accent bg-accent-soft",
                    // 正确答案：绿色高亮（管理 / 背题 / 提交后）
                    showAnswerHighlight &&
                      correct &&
                      "border-success/50 bg-emerald-500/12",
                    // 刷题选错：红色
                    showWrongPick && "border-danger/50 bg-red-500/12",
                    // 默认
                    !isSelected &&
                      !(showAnswerHighlight && correct) &&
                      !showWrongPick &&
                      "border-border bg-surface",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                      showAnswerHighlight && correct
                        ? "border-success bg-success text-white"
                        : isSelected && !showAnswerHighlight
                          ? "border-accent bg-accent text-white dark:text-zinc-950"
                          : showWrongPick
                            ? "border-danger bg-danger text-white"
                            : "border-border text-muted",
                    )}
                  >
                    {opt.key}
                  </span>
                  <LatexText className="min-w-0 flex-1 leading-relaxed">
                    {opt.text}
                  </LatexText>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {mode === "practice" && !revealed && (
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            disabled={selected.length === 0}
            onClick={submitPractice}
          >
            提交本题
          </Button>
        </div>
      )}

      {(revealed || mode === "memorize" || mode === "manage") && !editing && (
        <div className="mt-5 space-y-3 border-t border-border pt-4">
          <div>
            <p className="text-xs font-medium text-muted">答案</p>
            <p className="mt-1 text-sm font-semibold text-accent">
              {question.answer.join("、")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">解析</p>
            <LatexText className="mt-1 text-sm leading-relaxed text-foreground/90">
              {question.explanation}
            </LatexText>
          </div>
        </div>
      )}
    </article>
  );
}
