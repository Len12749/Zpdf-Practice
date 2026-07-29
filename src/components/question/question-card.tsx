"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LatexText } from "@/components/math/latex-text";
import type { Question } from "@/lib/mock-data";
import { cn } from "@/lib/cn";
import {
  Heart,
  PencilSimple,
  Trash,
  Sparkle,
} from "@phosphor-icons/react";
import { useState } from "react";

export function QuestionCard({
  question,
  index,
  mode = "manage",
  showAnswer = false,
}: {
  question: Question;
  index: number;
  mode?: "manage" | "practice" | "memorize";
  showAnswer?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [favorited, setFavorited] = useState(!!question.favorited);
  const [revealed, setRevealed] = useState(showAnswer || mode === "memorize");

  const toggleOption = (key: string) => {
    if (mode !== "practice" || revealed) return;
    if (question.type === "single") {
      setSelected([key]);
    } else {
      setSelected((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    }
  };

  const isCorrectKey = (key: string) => question.answer.includes(key);

  return (
    <article className="rounded-[var(--radius)] border border-border bg-surface p-5 shadow-[var(--shadow)] md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted">#{index + 1}</span>
          <Badge tone={question.type === "single" ? "neutral" : "accent"}>
            {question.type === "single" ? "单选" : "多选"}
          </Badge>
          {question.aiGeneratedAnswer && (
            <Badge tone="warning" className="gap-1">
              <Sparkle size={12} weight="fill" />
              答案 AI 生成
            </Badge>
          )}
          {question.aiGeneratedExplanation && (
            <Badge tone="warning" className="gap-1">
              <Sparkle size={12} weight="fill" />
              解析 AI 生成
            </Badge>
          )}
          {(question.wrongCount ?? 0) > 0 && mode !== "manage" && (
            <Badge tone="danger">错 {question.wrongCount} 次</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFavorited((v) => !v)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              favorited
                ? "bg-red-500/10 text-danger"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
            )}
            aria-label={favorited ? "取消收藏" : "收藏"}
          >
            <Heart size={18} weight={favorited ? "fill" : "regular"} />
          </button>
          {mode === "manage" && (
            <>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
                aria-label="编辑"
              >
                <PencilSimple size={18} />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-danger"
                aria-label="删除"
              >
                <Trash size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <LatexText
        as="p"
        className="text-[15px] leading-relaxed text-foreground md:text-base"
      >
        {question.stem}
      </LatexText>

      <ul className="mt-4 grid gap-2">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.key);
          const showResult = revealed && mode !== "manage";
          const correct = isCorrectKey(opt.key);

          return (
            <li key={opt.key}>
              <button
                type="button"
                onClick={() => toggleOption(opt.key)}
                disabled={mode === "manage" || revealed}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[var(--radius-sm)] border px-3.5 py-3 text-left text-sm transition-colors",
                  mode === "practice" && !revealed && "cursor-pointer hover:border-accent/40",
                  isSelected && !showResult && "border-accent bg-accent-soft",
                  showResult && correct && "border-success/40 bg-emerald-500/10",
                  showResult && isSelected && !correct && "border-danger/40 bg-red-500/10",
                  !isSelected && !showResult && "border-border bg-surface",
                  (mode === "manage" || revealed) && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                    isSelected || (showResult && correct)
                      ? "border-accent bg-accent text-white dark:text-zinc-950"
                      : "border-border text-muted",
                  )}
                >
                  {opt.key}
                </span>
                <LatexText as="span" className="leading-relaxed">
                  {opt.text}
                </LatexText>
              </button>
            </li>
          );
        })}
      </ul>

      {mode === "practice" && !revealed && (
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            disabled={selected.length === 0}
            onClick={() => setRevealed(true)}
          >
            提交本题
          </Button>
        </div>
      )}

      {(revealed || mode === "memorize" || mode === "manage") && (
        <div className="mt-5 space-y-3 border-t border-border pt-4">
          <div>
            <p className="text-xs font-medium text-muted">答案</p>
            <p className="mt-1 text-sm font-semibold text-accent">
              {question.answer.join("、")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">解析</p>
            <LatexText
              as="p"
              className="mt-1 text-sm leading-relaxed text-foreground/90"
            >
              {question.explanation}
            </LatexText>
          </div>
        </div>
      )}
    </article>
  );
}
