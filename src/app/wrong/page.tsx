"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuestionCard, type QuestionView } from "@/components/question/question-card";
import { LibrarySelect } from "@/components/libraries/library-select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useFeedback } from "@/components/ui/feedback";
import { api } from "@/lib/client-api";
import { useAuth } from "@/lib/auth-store";
import { SealQuestion, CheckCircle, ListChecks } from "@phosphor-icons/react";

type Lib = { id: string; name: string; status: string; questionCount?: number };

export default function WrongBookPage() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const { toast } = useFeedback();
  const [libs, setLibs] = useState<Lib[]>([]);
  const [libraryId, setLibraryId] = useState("");
  const [qs, setQs] = useState<(QuestionView & { libraryId: string })[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void api<{ libraries: Lib[] }>("/api/libraries")
      .then((d) => {
        const ready = d.libraries.filter((l) => l.status === "ready");
        setLibs(ready);
        setLibraryId((prev) => {
          if (prev && ready.some((l) => l.id === prev)) return prev;
          return ready[0]?.id ?? "";
        });
      })
      .finally(() => setLoaded(true));
  }, [isLoggedIn]);

  const loadWrong = () => {
    if (!libraryId) {
      setQs([]);
      return;
    }
    void api<{ questions: (QuestionView & { libraryId: string })[] }>(
      `/api/wrong?libraryId=${libraryId}`,
    ).then((d) => setQs(d.questions));
  };

  useEffect(() => {
    loadWrong();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryId]);

  if (loading || !isLoggedIn || !loaded) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-16 text-sm text-muted">
        加载中…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">错题本</h1>
      <p className="mt-2 text-sm text-muted">
        刷题时答错会立刻记入。点「我已学会」可移出本册。
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <LibrarySelect
          className="min-w-0 flex-1"
          label="选择题库"
          libraries={libs.map((l) => ({
            id: l.id,
            name: l.name,
            questionCount: l.questionCount,
          }))}
          value={libraryId}
          onChange={setLibraryId}
          emptyText="暂无题库，请先创建"
        />
        <Link
          href={
            libraryId
              ? `/practice/session?libraryId=${libraryId}&order=asc&wrongOnly=1`
              : "/practice"
          }
          className="shrink-0"
        >
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            icon={<ListChecks size={16} />}
            disabled={!libraryId}
          >
            错题巩固刷题
          </Button>
        </Link>
      </div>

      {!libraryId ? (
        <div className="mt-8">
          <EmptyState
            icon={<SealQuestion size={28} />}
            title="请先选择题库"
            description="选择后可查看该题库下的错题。"
            actionLabel="去题库"
            actionHref="/libraries"
          />
        </div>
      ) : !qs.length ? (
        <div className="mt-8">
          <EmptyState
            icon={<SealQuestion size={28} />}
            title="该题库暂无错题"
            description="刷题答错会马上记入这里，无需刷完整库。"
            actionLabel="去刷题"
            actionHref={`/practice?libraryId=${libraryId}`}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <p className="text-xs text-muted">共 {qs.length} 道错题</p>
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
                    })
                      .then(() => {
                        toast("已移出错题本", "success");
                        loadWrong();
                      })
                      .catch((e: Error) => toast(e.message, "error"));
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
