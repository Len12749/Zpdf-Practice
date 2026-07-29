"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { QuestionCard } from "@/components/question/question-card";
import { Button } from "@/components/ui/button";
import { useSwipeNav } from "@/hooks/use-swipe-nav";
import type { Library, Question } from "@/lib/mock-data";
import { ArrowLeft, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

type Mode = "practice" | "memorize";

export function QuestionSession({
  questions,
  library,
  mode,
  exitHref,
  subtitle,
}: {
  questions: Question[];
  library: Library;
  mode: Mode;
  exitHref: string;
  subtitle?: string;
}) {
  const [index, setIndex] = useState(0);
  const [nudge, setNudge] = useState<"left" | "right" | null>(null);
  const total = questions.length;
  const q = questions[index];

  const goPrev = useCallback(() => {
    setIndex((i) => {
      if (i <= 0) return i;
      setNudge("right");
      window.setTimeout(() => setNudge(null), 180);
      return i - 1;
    });
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) return i;
      setNudge("left");
      window.setTimeout(() => setNudge(null), 180);
      return i + 1;
    });
  }, [total]);

  const swipe = useSwipeNav({
    onPrev: goPrev,
    onNext: goNext,
  });

  if (!q) return null;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href={exitHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} />
          退出
        </Link>
        <p className="truncate text-sm text-muted">
          {subtitle ?? library.name}
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-sm text-muted">
          {index + 1} / {total}
        </span>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-muted sm:w-48">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <p className="mb-3 text-center text-xs text-muted md:hidden">
        左右滑动切换题目
      </p>

      <div
        className={cn(
          "touch-pan-y select-none transition-transform duration-150 ease-out",
          nudge === "left" && "-translate-x-2 opacity-90",
          nudge === "right" && "translate-x-2 opacity-90",
        )}
        {...swipe}
      >
        <QuestionCard key={q.id} question={q} index={index} mode={mode} />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          icon={<CaretLeft size={18} />}
          disabled={index === 0}
          onClick={goPrev}
        >
          上一题
        </Button>
        <Button
          icon={<CaretRight size={18} />}
          disabled={index >= total - 1}
          onClick={goNext}
        >
          下一题
        </Button>
      </div>
    </div>
  );
}
