"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { SortablePageRail } from "@/components/libraries/sortable-page-rail";
import { compressImageFile, convertPdfToImages } from "@/lib/pdf-client";
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
  Lightning,
  ArrowLeft,
  SpinnerGap,
} from "@phosphor-icons/react";

type LocalPage = { id: string; file: File; url: string; label: string };

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function isImageFile(file: File) {
  return (
    /\.(png|jpe?g|webp|gif)$/i.test(file.name) ||
    file.type.startsWith("image/")
  );
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function NewLibraryPage() {
  const { isLoggedIn, loading, speedTickets, refresh } = useAuth();
  const { toast } = useFeedback();
  const router = useRouter();
  const [name, setName] = useState("");
  const [pages, setPages] = useState<LocalPage[]>([]);
  const [useTicket, setUseTicket] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertLabel, setConvertLabel] = useState("");
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

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
      pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

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

  const removePage = useCallback(
    (id: string) => {
      setPages((ps) => {
        const target = ps.find((p) => p.id === id);
        if (target) URL.revokeObjectURL(target.url);
        const next = ps.filter((p) => p.id !== id);
        setPreviewId((cur) => {
          if (cur !== id) return cur;
          return next[0]?.id ?? null;
        });
        return next;
      });
    },
    [],
  );

  const movePage = useCallback((id: string, dir: -1 | 1) => {
    setPages((ps) => {
      const i = ps.findIndex((p) => p.id === id);
      if (i < 0) return ps;
      const j = i + dir;
      if (j < 0 || j >= ps.length) return ps;
      const next = [...ps];
      const [item] = next.splice(i, 1);
      next.splice(j, 0, item);
      return next;
    });
  }, []);

  const addFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList || started || converting) return;
    const arr = Array.from(fileList);
    if (!arr.length) return;

    const rejected: string[] = [];
    const pdfs: File[] = [];
    const images: File[] = [];

    for (const file of arr) {
      if (isPdfFile(file)) {
        if (file.size > MAX_SINGLE_FILE_BYTES) {
          rejected.push(
            `「${file.name}」超过单文件上限 ${formatFileSize(MAX_SINGLE_FILE_BYTES)}`,
          );
          continue;
        }
        pdfs.push(file);
      } else if (isImageFile(file)) {
        if (file.size > MAX_SINGLE_FILE_BYTES) {
          rejected.push(
            `「${file.name}」超过单文件上限 ${formatFileSize(MAX_SINGLE_FILE_BYTES)}`,
          );
          continue;
        }
        images.push(file);
      }
    }

    if (rejected.length) toast(rejected[0], "error");
    if (!pdfs.length && !images.length) {
      if (!rejected.length) toast("请选择 PDF 或图片文件", "error");
      return;
    }

    const existingTotal = pages.reduce((s, p) => s + p.file.size, 0);
    let budget = MAX_TOTAL_FILES_BYTES - existingTotal;
    if (budget <= 0) {
      toast(
        `文件总大小已达上限 ${formatFileSize(MAX_TOTAL_FILES_BYTES)}`,
        "error",
      );
      return;
    }

    const toAppend: LocalPage[] = [];

    // 图片：压缩后再加入
    for (const file of images) {
      try {
        const compressed = await compressImageFile(file);
        if (compressed.file.size > budget) {
          URL.revokeObjectURL(compressed.url);
          toast(
            `「${file.name}」加入后将超过总大小上限 ${formatFileSize(MAX_TOTAL_FILES_BYTES)}`,
            "error",
          );
          break;
        }
        budget -= compressed.file.size;
        toAppend.push({
          id: uid("img"),
          file: compressed.file,
          url: compressed.url,
          label: compressed.label,
        });
      } catch {
        toast(`「${file.name}」处理失败，已跳过`, "error");
      }
    }

    // PDF 立即转成图片页
    if (pdfs.length) {
      setConverting(true);
      try {
        for (const pdf of pdfs) {
          setConvertLabel(`正在转换 ${pdf.name}…`);
          toast(`正在将「${pdf.name}」转为图片页…`, "info");
          const pageImages = await convertPdfToImages(pdf, (done, total) => {
            setConvertLabel(`转换 ${pdf.name}（${done}/${total}）…`);
          });

          for (const page of pageImages) {
            if (page.file.size > budget) {
              URL.revokeObjectURL(page.url);
              toast(
                `转图后总大小将超过 ${formatFileSize(MAX_TOTAL_FILES_BYTES)}，已截断后续页面`,
                "warning",
              );
              // revoke remaining
              const idx = pageImages.indexOf(page);
              pageImages.slice(idx + 1).forEach((p) => URL.revokeObjectURL(p.url));
              break;
            }
            budget -= page.file.size;
            toAppend.push({
              id: uid("page"),
              file: page.file,
              url: page.url,
              label: page.label,
            });
          }
        }
      } catch (e) {
        toast(
          e instanceof Error ? e.message : "PDF 转换失败，请换文件重试",
          "error",
        );
      } finally {
        setConverting(false);
        setConvertLabel("");
      }
    }

    if (!toAppend.length) return;

    setPages((ps) => {
      const merged = [...ps, ...toAppend];
      setPreviewId((cur) => cur ?? merged[0]?.id ?? null);
      return merged;
    });
    toast(`已添加 ${toAppend.length} 页，可拖拽或用箭头排序`, "success");
  };

  const reorderByIds = useCallback((fromId: string, toId: string) => {
    setPages((ps) => {
      const from = ps.findIndex((p) => p.id === fromId);
      const to = ps.findIndex((p) => p.id === toId);
      if (from < 0 || to < 0 || from === to) return ps;
      const next = [...ps];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const startImport = async () => {
    if (converting) {
      toast("请等待 PDF 转换完成", "warning");
      return;
    }
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

  const busy = started || converting;

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
            上传 PDF 或图片。PDF 选中后立即转成图片页，方便预览与排序。
          </p>
        </div>
        <Badge tone="neutral">加速券剩余 {speedTickets} 张</Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-4">
          <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
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
                if (!busy) setDropActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!busy) setDropActive(true);
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
                if (busy) return;
                void addFiles(e.dataTransfer.files);
              }}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                {converting ? (
                  <SpinnerGap size={24} className="animate-spin" />
                ) : (
                  <UploadSimple size={24} weight="regular" />
                )}
              </div>
              <p className="mt-3 text-sm font-medium">
                {converting
                  ? convertLabel || "正在转换 PDF…"
                  : "拖拽 PDF / 图片到此处，或点击选择"}
              </p>
              <p className="mt-1 text-xs text-muted">
                PDF 会立即转成图片页 · 单文件 ≤{" "}
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
                    disabled={busy}
                    onChange={(e) => {
                      void addFiles(e.target.files);
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
                    disabled={busy}
                    onChange={(e) => {
                      void addFiles(e.target.files);
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
                disabled={speedTickets <= 0 || busy}
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
            disabled={!name.trim() || pages.length === 0 || busy}
            onClick={() => void startImport()}
          >
            {started
              ? "提取中…"
              : converting
                ? "转换中…"
                : "开始 AI 提取"}
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
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">页面预览与排序</h2>
              <span className="text-xs text-muted">
                {pages.length} 页 · 按住把手拖动，松手落位
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-[120px_1fr]">
              <SortablePageRail
                pages={pages}
                activeId={preview?.id ?? null}
                disabled={busy}
                onReorder={reorderByIds}
                onSelect={setPreviewId}
                onMove={movePage}
                onRemove={removePage}
              />

              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl bg-surface-muted p-4 md:min-h-[560px]">
                {converting && !preview ? (
                  <div className="flex flex-col items-center gap-3 text-sm text-muted">
                    <SpinnerGap size={28} className="animate-spin text-accent" />
                    <p>{convertLabel || "正在转换 PDF…"}</p>
                  </div>
                ) : preview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview.url}
                      alt={preview.label}
                      className="max-h-[480px] w-auto max-w-full rounded-lg border border-border object-contain"
                    />
                    <p className="mt-3 max-w-full truncate text-center text-xs text-muted">
                      {preview.label}
                    </p>
                  </>
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
