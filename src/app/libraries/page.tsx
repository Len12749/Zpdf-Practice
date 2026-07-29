"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LibraryCard } from "@/components/libraries/library-card";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/client-api";
import { useFeedback } from "@/components/ui/feedback";
import { FolderOpen, Plus, FileCsv } from "@phosphor-icons/react";
import type { LibraryStatus } from "@/lib/mock-data";

type Lib = {
  id: string;
  name: string;
  source: "upload" | "csv";
  status: "ready" | "importing" | "failed";
  questionCount: number;
  createdAt: string;
  updatedAt: string;
  importProgress: {
    completed: number;
    total: number;
    pageCount: number;
    phaseLabel: string;
    accelerated?: boolean;
    error?: string | null;
  } | null;
};

export default function LibrariesPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { toast, confirm } = useFeedback();
  const router = useRouter();
  const [libs, setLibs] = useState<Lib[]>([]);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await api<{ libraries: Lib[]; limit: number }>(
      "/api/libraries",
    );
    setLibs(data.libraries);
    setLimit(data.limit);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace("/login");
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void load();
    const t = setInterval(() => {
      void load().catch(() => undefined);
    }, 3000);
    return () => clearInterval(t);
  }, [isLoggedIn, load]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-16 text-sm text-muted">
        加载题库…
      </div>
    );
  }

  const used = libs.length;
  const importingCount = libs.filter((l) => l.status === "importing").length;
  const failedCount = libs.filter((l) => l.status === "failed").length;

  const handleDelete = async (id: string) => {
    const target = libs.find((l) => l.id === id);
    const ok = await confirm({
      title:
        target?.status === "importing"
          ? "取消并删除导入任务？"
          : target?.status === "failed"
            ? "删除失败任务？"
            : "删除题库？",
      description:
        target?.status === "importing"
          ? "已发起的 API 请求会尽快停止，不再继续耗额度。临时文件也会清理。"
          : target?.status === "failed"
            ? "删除后可重新上传导入。"
            : "将同时清除错题本与收藏夹中对应题目，此操作不可恢复。",
      confirmLabel: target?.status === "importing" ? "取消并删除" : "删除",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/api/libraries/${id}`, { method: "DELETE" });
      await load();
      toast("已删除", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "删除失败", "error");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-6 md:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">题库管理</h1>
          <p className="mt-2 text-sm text-muted">
            已用 {used} / {limit} 个题库名额
            {importingCount > 0 && (
              <span className="text-warning">
                {" "}
                · {importingCount} 个正在导入
              </span>
            )}
            {failedCount > 0 && (
              <span className="text-danger">
                {" "}
                · {failedCount} 个导入失败
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/libraries/import">
            <Button variant="outline" icon={<FileCsv size={18} />}>
              导入 CSV
            </Button>
          </Link>
          <Link href="/libraries/new">
            <Button icon={<Plus size={18} weight="bold" />}>新建题库</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-[var(--radius)] border border-border bg-surface p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">题库容量</span>
          <span className="font-mono">
            {used}/{limit}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
          />
        </div>
      </div>

      {!libs.length ? (
        <div className="mt-8">
          <EmptyState
            icon={<FolderOpen size={28} />}
            title="还没有题库"
            description="上传 PDF/图片 让 AI 提取选择题，或用 CSV 模板批量导入。"
            actionLabel="创建第一个题库"
            actionHref="/libraries/new"
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {libs.map((lib) => (
            <li key={lib.id}>
              <LibraryCard
                onDelete={(id) => void handleDelete(id)}
                library={{
                  id: lib.id,
                  name: lib.name,
                  questionCount: lib.questionCount,
                  createdAt: String(lib.createdAt).slice(0, 10),
                  updatedAt: String(lib.updatedAt).slice(0, 10),
                  source: lib.source,
                  status: lib.status as LibraryStatus,
                  importProgress:
                    lib.status === "importing" || lib.status === "failed"
                      ? {
                          completed: lib.importProgress?.completed ?? 0,
                          total: lib.importProgress?.total ?? 1,
                          pageCount: lib.importProgress?.pageCount ?? 0,
                          phaseLabel:
                            lib.status === "failed"
                              ? lib.importProgress?.error ||
                                lib.importProgress?.phaseLabel ||
                                "导入失败"
                              : lib.importProgress?.phaseLabel || "处理中…",
                          accelerated: lib.importProgress?.accelerated,
                        }
                      : undefined,
                }}
              />
            </li>
          ))}
          {used < limit && (
            <li>
              <Link
                href="/libraries/new"
                className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-border bg-surface/50 p-5 text-center transition-colors hover:border-accent/40 hover:bg-accent-soft/30"
              >
                <Plus size={28} className="text-muted" />
                <span className="mt-3 text-sm font-medium text-muted">
                  新建题库
                </span>
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
