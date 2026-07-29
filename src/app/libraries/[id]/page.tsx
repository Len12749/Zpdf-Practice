"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/question/question-card";
import { ImportProgressPanel } from "@/components/import/import-progress";
import { api } from "@/lib/client-api";
import { useAuth } from "@/lib/auth-store";
import { useFeedback } from "@/components/ui/feedback";
import {
  ArrowLeft,
  ListChecks,
  BookOpenText,
  Trash,
  LockSimple,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

type Q = {
  id: string;
  stem: string;
  options: { key: string; text: string }[];
  answer: string[];
  explanation: string;
  type: "single" | "multiple";
  aiGeneratedAnswer: boolean;
  aiGeneratedExplanation: boolean;
};

export default function LibraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { toast, confirm } = useFeedback();
  const router = useRouter();
  const [lib, setLib] = useState<{
    id: string;
    name: string;
    status: string;
    questionCount: number;
    createdAt: string;
    importProgress: {
      completed: number;
      total: number;
      pageCount: number;
      phaseLabel: string;
      accelerated?: boolean;
      error?: string | null;
    };
  } | null>(null);
  const [qs, setQs] = useState<Q[]>([]);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const data = await api<{
      library: typeof lib;
      questions: Q[];
      locked: boolean;
    }>(`/api/libraries/${id}`);
    setLib(data.library);
    setQs(data.questions);
    setLocked(data.locked);
  }, [id]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace("/login");
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn || !id) return;
    void load().catch((e: Error) => setError(e.message));
    const t = setInterval(() => {
      void load().catch(() => undefined);
    }, 3000);
    return () => clearInterval(t);
  }, [isLoggedIn, id, load]);

  if (!lib) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-16 text-sm text-muted">
        {error || "加载中…"}
      </div>
    );
  }

  if (locked || lib.status === "importing" || lib.status === "failed") {
    const failed = lib.status === "failed";
    return (
      <div className="mx-auto max-w-lg px-4 py-10 md:px-6">
        <Link
          href="/libraries"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} />
          返回题库
        </Link>
        <div className="mt-6 rounded-[var(--radius)] border border-border bg-surface p-6">
          <div
            className={cn(
              "flex items-center gap-2",
              failed ? "text-danger" : "text-warning",
            )}
          >
            <LockSimple size={20} weight="fill" />
            <span className="text-sm font-semibold">
              {failed ? "导入失败" : "正在导入 · 暂不可打开"}
            </span>
          </div>
          <h1 className="mt-3 text-xl font-semibold">{lib.name}</h1>
          <div className="mt-5">
            <ImportProgressPanel
              progress={{
                completed: lib.importProgress.completed,
                total: Math.max(lib.importProgress.total, 1),
                pageCount: lib.importProgress.pageCount,
                phaseLabel: failed
                  ? lib.importProgress.error ||
                    lib.importProgress.phaseLabel ||
                    "导入失败"
                  : lib.importProgress.phaseLabel || "处理中…",
                accelerated: lib.importProgress.accelerated,
              }}
              variant="panel"
            />
          </div>
          <Button
            className="mt-4 w-full"
            variant="danger"
            icon={<Trash size={16} />}
            onClick={() => {
              void (async () => {
                const ok = await confirm({
                  title: failed ? "删除失败任务？" : "取消并删除导入任务？",
                  description: failed
                    ? "删除后可重新上传导入。"
                    : "将停止后续 API 调用，并清理临时文件。",
                  confirmLabel: failed ? "删除" : "取消并删除",
                  danger: true,
                });
                if (!ok) return;
                try {
                  await api(`/api/libraries/${id}`, { method: "DELETE" });
                  toast("已删除", "success");
                  router.push("/libraries");
                } catch (e) {
                  toast(e instanceof Error ? e.message : "删除失败", "error");
                }
              })();
            }}
          >
            {failed ? "删除失败任务" : "取消并删除"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-6 md:py-10">
      <Link
        href="/libraries"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} />
        返回题库
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {lib.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {lib.questionCount} 道题 · 创建于{" "}
            {String(lib.createdAt).slice(0, 10)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/practice?libraryId=${lib.id}`}>
            <Button size="sm" icon={<ListChecks size={16} />}>
              刷题
            </Button>
          </Link>
          <Link href={`/memorize?libraryId=${lib.id}`}>
            <Button size="sm" variant="outline" icon={<BookOpenText size={16} />}>
              背题
            </Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            icon={<Trash size={16} />}
            onClick={() => {
              void (async () => {
                const ok = await confirm({
                  title: "删除题库？",
                  description:
                    "将同时清除错题本与收藏夹中对应题目，此操作不可恢复。",
                  confirmLabel: "删除题库",
                  danger: true,
                });
                if (!ok) return;
                try {
                  await api(`/api/libraries/${id}`, { method: "DELETE" });
                  toast("题库已删除", "success");
                  router.push("/libraries");
                } catch (e) {
                  toast(e instanceof Error ? e.message : "删除失败", "error");
                }
              })();
            }}
          >
            删除题库
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {qs.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={{
              id: q.id,
              stem: q.stem,
              options: q.options,
              answer: q.answer,
              explanation: q.explanation,
              type: q.type,
              aiGeneratedAnswer: Boolean(q.aiGeneratedAnswer),
              aiGeneratedExplanation: Boolean(q.aiGeneratedExplanation),
            }}
            index={i}
            mode="manage"
            libraryId={lib.id}
            onDeleted={() => void load()}
            onUpdated={() => void load()}
          />
        ))}
        {!qs.length && (
          <p className="text-sm text-muted">暂无题目，可重新导入或手动添加。</p>
        )}
      </div>
    </div>
  );
}
