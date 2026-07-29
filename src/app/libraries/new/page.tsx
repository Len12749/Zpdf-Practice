"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImportProgressPanel } from "@/components/import/import-progress";
import {
  computeTaskTotal,
  mockPageImages,
  type ImportProgress,
} from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import {
  UploadSimple,
  FilePdf,
  Images,
  DotsSixVertical,
  MagnifyingGlassPlus,
  Trash,
  Lightning,
  ArrowLeft,
  X,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";

export default function NewLibraryPage() {
  const { speedTickets } = useAuth();
  const [name, setName] = useState("");
  const [pages, setPages] = useState(mockPageImages);
  const [useTicket, setUseTicket] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [demoCompleted, setDemoCompleted] = useState(3);

  const liveProgress: ImportProgress = useMemo(() => {
    const total = computeTaskTotal(pages.length, "upload");
    const completed = Math.min(demoCompleted, total);
    const extractTotal = pages.length;
    const phaseLabel =
      completed < extractTotal
        ? `正在提取第 ${completed + 1} 页题目…`
        : completed < total
          ? `正在判断第 ${completed - extractTotal + 1} 组跨页拼接…`
          : "提取完成，准备复审…";
    return {
      completed,
      total,
      pageCount: pages.length,
      phaseLabel,
      accelerated: useTicket,
    };
  }, [pages.length, demoCompleted, useTicket]);

  const previewIndex = pages.findIndex((p) => p.id === previewId);
  const preview = previewIndex >= 0 ? pages[previewIndex] : null;

  const onDragStart = (id: string) => setDragId(id);
  const onDrop = (targetId: string) => {
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
        <Badge tone="neutral">
          加速券剩余 {speedTickets} 张
        </Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* Left: config + upload */}
        <div className="space-y-5 lg:col-span-4">
          <fieldset disabled={started} className="space-y-5 disabled:opacity-60">
            <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
              <Input
                label="题库名称"
                required
                placeholder="例如：高数期末真题 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                hint="必填，便于在刷题时区分"
              />
            </div>

            <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <UploadSimple size={24} weight="duotone" />
              </div>
              <p className="mt-3 text-sm font-medium">
                拖拽文件到此处，或点击选择
              </p>
              <p className="mt-1 text-xs text-muted">支持 PDF、JPG、PNG</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button size="sm" variant="outline" icon={<FilePdf size={16} />}>
                  选择 PDF
                </Button>
                <Button size="sm" variant="outline" icon={<Images size={16} />}>
                  选择图片
                </Button>
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
            onClick={() => {
              setStarted(true);
              setDemoCompleted(3);
            }}
          >
            {started ? "提取中…" : "开始 AI 提取"}
          </Button>

          {started && (
            <div className="space-y-3">
              <ImportProgressPanel progress={liveProgress} variant="panel" />
              <p className="text-xs leading-relaxed text-muted">
                任务已提交。你可返回题库列表查看同一进度；导入完成前题库不可打开。
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/libraries">
                  <Button variant="secondary" size="sm" className="w-full">
                    返回题库列表查看进度
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    setDemoCompleted((c) =>
                      Math.min(c + 2, liveProgress.total),
                    )
                  }
                >
                  模拟进度 +2（演示）
                </Button>
                <Link href="/libraries/lib-1/review">
                  <Button variant="ghost" size="sm" className="w-full">
                    跳过演示，查看复审页
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: page strip + main preview */}
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
                {started
                  ? "导入中，页面顺序已锁定"
                  : "拖拽调整顺序 · 点击缩略图查看大图"}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-[100px_1fr]">
              {/* Thumbnails */}
              <ul className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:max-h-[560px] md:overflow-y-auto md:overflow-x-visible">
                {pages.map((page, i) => (
                  <li
                    key={page.id}
                    draggable={!started}
                    onDragStart={() => !started && onDragStart(page.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => !started && onDrop(page.id)}
                    className={cn(
                      "group relative shrink-0",
                      started
                        ? "cursor-not-allowed"
                        : "cursor-grab active:cursor-grabbing",
                      dragId === page.id && "opacity-50",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewId(page.id)}
                      className={cn(
                        "block w-[88px] overflow-hidden rounded-lg border-2 transition-colors",
                        previewId === page.id
                          ? "border-accent"
                          : "border-border hover:border-accent/40",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={page.url}
                        alt={page.label}
                        className="aspect-[3/4] w-full object-cover"
                      />
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
                        setPages((ps) => ps.filter((p) => p.id !== page.id))
                      }
                      className="absolute right-0.5 top-0.5 rounded bg-zinc-950/60 p-0.5 text-white opacity-0 group-hover:opacity-100"
                      aria-label="删除页"
                    >
                      <Trash size={12} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Large preview area */}
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl bg-surface-muted p-4 md:min-h-[560px]">
                {pages[0] ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={(preview ?? pages[0]).url}
                      alt={(preview ?? pages[0]).label}
                      className="max-h-[480px] w-auto max-w-full rounded-lg border border-border object-contain shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewId((preview ?? pages[0]).id)}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                    >
                      <MagnifyingGlassPlus size={16} />
                      全屏查看
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-muted">请先上传文件</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4"
          onClick={() => setPreviewId(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setPreviewId(null)}
            aria-label="关闭"
          >
            <X size={22} />
          </button>
          <button
            type="button"
            className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-30"
            disabled={previewIndex <= 0}
            onClick={(e) => {
              e.stopPropagation();
              setPreviewId(pages[previewIndex - 1]?.id ?? null);
            }}
            aria-label="上一页"
          >
            <CaretLeft size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.url}
            alt={preview.label}
            className="max-h-[90dvh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-30 md:right-16"
            disabled={previewIndex >= pages.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              setPreviewId(pages[previewIndex + 1]?.id ?? null);
            }}
            aria-label="下一页"
          >
            <CaretRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
