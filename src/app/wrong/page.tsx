"use client";

import { useState } from "react";
import Link from "next/link";
import { QuestionCard } from "@/components/question/question-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { mockLibraries, mockQuestions } from "@/lib/mock-data";
import { SealQuestion, CheckCircle } from "@phosphor-icons/react";

export default function WrongBookPage() {
  const [libraryId, setLibraryId] = useState(mockLibraries[0]?.id ?? "");
  const wrongs = mockQuestions.filter((q) => (q.wrongCount ?? 0) > 0);

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">错题本</h1>
      <p className="mt-2 text-sm text-muted">
        先选择题库。点「我已学会」可清空错误次数；再次答错会重新累计。
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">题库</label>
          <select
            value={libraryId}
            onChange={(e) => setLibraryId(e.target.value)}
            className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {mockLibraries.map((lib) => (
              <option key={lib.id} value={lib.id}>
                {lib.name}
              </option>
            ))}
          </select>
        </div>
        <Link href="/practice">
          <Button variant="outline">错题巩固刷题</Button>
        </Link>
      </div>

      {wrongs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<SealQuestion size={28} />}
            title="该题库暂无错题"
            description="刷题答错后会自动记入这里。"
            actionLabel="去刷题"
            actionHref="/practice"
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {wrongs.map((q, i) => (
            <div key={q.id} className="relative">
              <QuestionCard question={q} index={i} mode="memorize" />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<CheckCircle size={16} weight="fill" />}
                >
                  我已学会
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
