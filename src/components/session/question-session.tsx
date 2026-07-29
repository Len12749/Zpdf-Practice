"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuestionCard, type QuestionView } from "@/components/question/question-card";
import { Button } from "@/components/ui/button";
import { useSwipeNav } from "@/hooks/use-swipe-nav";
import { api } from "@/lib/client-api";
import { useAuth } from "@/lib/auth-store";
import { ArrowLeft, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export function QuestionSession({
  mode,
  exitHref,
}: {
  mode: "practice" | "memorize";
  exitHref: string;
}) {
  const sp = useSearchParams();
  const libraryId = sp.get("libraryId") ?? "";
  const order = sp.get("order") ?? "asc";
  const wrongOnly = sp.get("wrongOnly") === "1";
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();

  const [questions, setQuestions] = useState<QuestionView[]>([]);
  const [libName, setLibName] = useState("");
  const [index, setIndex] = useState(0);
  const [nudge, setNudge] = useState<"left" | "right" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn || !libraryId) return;
    const q = new URLSearchParams({
      libraryId,
      order,
      ...(wrongOnly ? { wrongOnly: "1" } : {}),
    });
    void api<{
      library: { name: string };
      questions: QuestionView[];
    }>(`/api/session-questions?${q}`)
      .then((d) => {
        setLibName(d.library.name);
        setQuestions(d.questions);
      })
      .catch((e: Error) => setError(e.message));
  }, [isLoggedIn, libraryId, order, wrongOnly]);

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

  const swipe = useSwipeNav({ onPrev: goPrev, onNext: goNext });

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-danger">{error}</p>
        <Link href={exitHref} className="mt-4 inline-block text-sm text-accent">
          返回
        </Link>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted">
        {total === 0 ? "没有题目可练" : "加载中…"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href={exitHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-danger hover:opacity-80"
        >
          <ArrowLeft size={16} />
          退出
        </Link>
        <p className="truncate text-sm text-muted">
          {libName}
          {mode === "memorize" ? " · 背题" : ""}
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
        <QuestionCard
          key={q.id}
          question={q}
          index={index}
          mode={mode}
          libraryId={libraryId}
        />
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
