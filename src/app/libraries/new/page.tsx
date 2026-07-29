"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImportProgressPanel } from "@/components/import/import-progress";
import { useFeedback } from "@/components/ui/feedback";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import {
  formatFileSize,
  MAX_SINGLE_FILE_BYTES,
  MAX_TOTAL_FILES_BYTES,
  validateUploadFileSizes,
} from "@/lib/upload-limits";
import {
  UploadSimple,
  FilePdf,
  Images,
  DotsSixVertical,
  Trash,
  Lightning,
  ArrowLeft,
} from "@phosphor-icons/react";

type LocalPage = { id: string; file: File; url: string; label: string };

export default function NewLibraryPage() {
  const { isLoggedIn, loading, speedTickets, refresh } = useAuth();
  const { toast } = useFeedback();
  const router = useRouter();
  const [name, setName] = useState("");
  const [pages, setPages] = useState<LocalPage[]>([]);
  const [useTicket, setUseTicket] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [progress, setProgress] = useState({
    completed: 0,
    total: 1,
    pageCount: 0,
    phaseLabel: "提交中…",
    accelerated: false,
  });

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    return () => {
      pages.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [pages]);

  useEffect(() => {
    if (!jobId) return;
    const t = setInterval(() => {
      void api<{
        library: {
          status: string;
          importProgress: {
            completed: number;
            total: number;
            pageCount: number;
            phaseLabel: string;
            accelerated: boolean;
            error?: string | null;
          };
        };
      }>(`/api/libraries/${jobId}`)
        .then((data) => {
          const p = data.library.importProgress;
          setProgress({
            completed: p.completed,
            total: Math.max(p.total, 1),
            pageCount: p.pageCount,
            phaseLabel: p.phaseLabel || "处理中…",
            accelerated: p.accelerated,
          });
          if (data.library.status === "ready") {
            clearInterval(t);
            router.push(`/libraries/${jobId}/review`);
          }
          if (data.library.status === "failed") {
            clearInterval(t);
            toast(p.error || "导入失败", "error");
            setStarted(false);
          }
        })
        .catch(() => undefined);
    }, 2000);
    return () => clearInterval(t);
  }, [jobId, router, toast]);

  const preview =
    pages.find((p) => p.id === previewId) ?? pages[0] ?? null;

  const addFiles = (fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList);
    const next: LocalPage[] = [];
    const rejected: string[] = [];

    arr.forEach((file, i) => {
      const ok =
        /\.(pdf|png|jpe?g|webp|gif)$/i.test(file.name) ||
        file.type.startsWith("image/") ||
        file.type === "application/pdf";
      if (!ok) return;
      if (file.size > MAX_SINGLE_FILE_BYTES) {
        rejected.push(
          `「${file.name}」超过单文件上限 ${formatFileSize(MAX_SINGLE_FILE_BYTES)}`,
        );
        return;
      }
      next.push({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        url: URL.createObjectURL(file),
        label: file.name,
      });
    });

    if (!next.length) {
      if (rejected.length) toast(rejected[0], "error");
      return;
    }

    const existingTotal = pages.reduce((s, p) => s + p.file.size, 0);
    const addTotal = next.reduce((s, p) => s + p.file.size, 0);
    if (existingTotal + addTotal > MAX_TOTAL_FILES_BYTES) {
      next.forEach((p) => URL.revokeObjectURL(p.url));
      toast(
        `文件总大小将超过 ${formatFileSize(MAX_TOTAL_FILES_BYTES)}（已有 ${formatFileSize(existingTotal)}，本次 ${formatFileSize(addTotal)}）`,
        "error",
      );
      return;
    }

    if (rejected.length) toast(rejected[0], "error");

    setPages((ps) => {
      const merged = [...ps, ...next];
      if (!previewId && merged[0]) setPreviewId(merged[0].id);
      return merged;
    });
  };

  const onReorderDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = pages.findIndex((p) => p.id === dragId);
    const to = pages.findIndex((p) => p.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...pages];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setPages(next);
    setDragId(null);
  };

  const startImport = async () => {
    const sizeError = validateUploadFileSizes(pages.map((p) => p.file));
    if (sizeError) {
      toast(sizeError, "error");
      return;
    }
    setStarted(true);
    try {
      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("useTicket", useTicket ? "1" : "0");
      for (const p of pages) fd.append("files", p.file, p.file.name);
      const data = await api<{ id: string }>("/api/libraries/upload", {
        method: "POST",
        body: fd,
      });
      setJobId(data.id);
      setProgress((p) => ({
        ...p,
        pageCount: pages.length,
        total: pages.length + Math.max(0, pages.length - 1),
        phaseLabel: "任务已创建…",
        accelerated: useTicket,
      }));
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "上传失败", "error");
      setStarted(false);
    }
  };

  const isPdf = (p: LocalPage) =>
    p.file.type === "application/pdf" ||
    p.file.name.toLowerCase().endsWith(".pdf");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-10">
      <Link
        href="/libraries"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} />
        返回题库
      </Link>

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">新建题库</h1>
          <p className="mt-2 text-sm text-muted">
            上传 PDF 或一组图片。PDF 将自动转为图片页。
          </p>
        </div>
        <Badge tone="neutral">加速券剩余 {speedTickets} 张</Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-4">
          <fieldset disabled={started} className="space-y-5 disabled:opacity-60">
            <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
              <Input
                label="题库名称"
                required
                placeholder="例如：高数期末真题 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div
              className={cn(
                "rounded-[var(--radius)] border border-dashed bg-surface p-6 text-center transition-colors",
                dropActive
                  ? "border-accent bg-accent-soft/40"
                  : "border-border",
              )}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!started) setDropActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!started) setDropActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropActive(false);
                if (started) return;
                addFiles(e.dataTransfer.files);
              }}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <UploadSimple size={24} weight="regular" />
              </div>
              <p className="mt-3 text-sm font-medium">
                拖拽 PDF / 图片到此处，或点击选择
              </p>
              <p className="mt-1 text-xs text-muted">
                支持 PDF、JPG、PNG、WebP · 单文件 ≤{" "}
                {formatFileSize(MAX_SINGLE_FILE_BYTES)} · 合计 ≤{" "}
                {formatFileSize(MAX_TOTAL_FILES_BYTES)}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <label className="inline-flex cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    multiple
                    disabled={started}
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-transparent px-3 text-sm font-medium hover:bg-surface-muted">
                    <FilePdf size={16} />
                    选择 PDF
                  </span>
                </label>
                <label className="inline-flex cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    multiple
                    disabled={started}
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-transparent px-3 text-sm font-medium hover:bg-surface-muted">
                    <Images size={16} />
                    选择图片
                  </span>
                </label>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border border-border bg-surface p-4">
              <input
                type="checkbox"
                checked={useTicket}
                onChange={(e) => setUseTicket(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                disabled={speedTickets <= 0 || started}
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Lightning size={16} className="text-warning" weight="fill" />
                  使用任务加速券
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  仅在任务开始时勾选有效。可将提取速率提升至四倍。
                </span>
              </span>
            </label>
          </fieldset>

          <Button
            className="w-full"
            size="lg"
            disabled={!name.trim() || pages.length === 0 || started}
            onClick={() => void startImport()}
          >
            {started ? "提取中…" : "开始 AI 提取"}
          </Button>

          {started && (
            <div className="space-y-3">
              <ImportProgressPanel progress={progress} variant="panel" />
              <Link href="/libraries">
                <Button variant="secondary" size="sm" className="w-full">
                  返回题库列表查看进度
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div
          className={cn(
            "lg:col-span-8",
            started && "pointer-events-none opacity-60",
          )}
        >
          <div className="rounded-[var(--radius)] border border-border bg-surface p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">页面预览与排序</h2>
              <span className="text-xs text-muted">
                {pages.length} 个文件 · 拖拽缩略图调序
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-[100px_1fr]">
              <ul className="flex gap-2 overflow-x-auto pb-1 md:max-h-[560px] md:flex-col md:overflow-y-auto">
                {pages.map((page, i) => (
                  <li
                    key={page.id}
                    draggable={!started}
                    onDragStart={() => setDragId(page.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onReorderDrop(page.id)}
                    className={cn(
                      "group relative shrink-0",
                      dragId === page.id && "opacity-50",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewId(page.id)}
                      className={cn(
                        "block w-[88px] overflow-hidden rounded-lg border-2",
                        preview?.id === page.id
                          ? "border-accent"
                          : "border-border",
                      )}
                    >
                      {isPdf(page) ? (
                        <div className="flex aspect-[3/4] items-center justify-center bg-surface-muted text-xs text-muted">
                          PDF
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={page.url}
                          alt={page.label}
                          className="aspect-[3/4] w-full object-cover"
                        />
                      )}
                    </button>
                    <span className="mt-1 block text-center font-mono text-[10px] text-muted">
                      {i + 1}
                    </span>
                    <span className="absolute left-0.5 top-0.5 rounded bg-zinc-950/60 p-0.5 text-white opacity-0 group-hover:opacity-100">
                      <DotsSixVertical size={12} />
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPages((ps) => {
                          const next = ps.filter((p) => p.id !== page.id);
                          if (previewId === page.id) {
                            setPreviewId(next[0]?.id ?? null);
                          }
                          return next;
                        })
                      }
                      className="absolute right-0.5 top-0.5 rounded bg-zinc-950/60 p-0.5 text-white opacity-0 group-hover:opacity-100"
                      aria-label="删除"
                    >
                      <Trash size={12} />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl bg-surface-muted p-4 md:min-h-[560px]">
                {preview ? (
                  isPdf(preview) ? (
                    <p className="text-sm text-muted">
                      PDF 将在上传后自动转图（{preview.label}）
                    </p>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview.url}
                      alt={preview.label}
                      className="max-h-[480px] w-auto max-w-full rounded-lg border border-border object-contain"
                    />
                  )
                ) : (
                  <p className="text-sm text-muted">
                    拖拽或选择文件后在此预览
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
