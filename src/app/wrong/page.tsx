"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuestionCard, type QuestionView } from "@/components/question/question-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/client-api";
import { useAuth } from "@/lib/auth-store";
import { SealQuestion, CheckCircle } from "@phosphor-icons/react";

type Lib = { id: string; name: string; status: string };

export default function WrongBookPage() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [libs, setLibs] = useState<Lib[]>([]);
  const [libraryId, setLibraryId] = useState("");
  const [qs, setQs] = useState<(QuestionView & { libraryId: string })[]>([]);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void api<{ libraries: Lib[] }>("/api/libraries").then((d) => {
      setLibs(d.libraries.filter((l) => l.status === "ready"));
      if (d.libraries[0]) setLibraryId(d.libraries[0].id);
    });
  }, [isLoggedIn]);

  const loadWrong = () => {
    if (!libraryId) return;
    void api<{ questions: (QuestionView & { libraryId: string })[] }>(
      `/api/wrong?libraryId=${libraryId}`,
    ).then((d) => setQs(d.questions));
  };

  useEffect(() => {
    loadWrong();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryId]);

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">错题本</h1>
      <p className="mt-2 text-sm text-muted">
        先选择题库。点「我已学会」可清空错误次数。
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">题库</label>
          <select
            value={libraryId}
            onChange={(e) => setLibraryId(e.target.value)}
            className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm"
          >
            {libs.map((lib) => (
              <option key={lib.id} value={lib.id}>
                {lib.name}
              </option>
            ))}
          </select>
        </div>
        <Link href={`/practice?libraryId=${libraryId}`}>
          <Button variant="outline">错题巩固刷题</Button>
        </Link>
      </div>

      {!qs.length ? (
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
          {qs.map((q, i) => (
            <div key={q.id}>
              <QuestionCard
                question={q}
                index={i}
                mode="memorize"
                libraryId={q.libraryId}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<CheckCircle size={16} weight="fill" />}
                  onClick={() => {
                    void api("/api/wrong", {
                      method: "DELETE",
                      body: JSON.stringify({ questionId: q.id }),
                    }).then(loadWrong);
                  }}
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
