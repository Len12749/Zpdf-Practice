"use client";

import type { ImportProgress } from "@/lib/mock-data";
import { cn } from "@/lib/cn";
import { Lightning, SpinnerGap } from "@phosphor-icons/react";

type Props = {
  progress: ImportProgress;
  /** compact: 题库卡片内；panel: 新建任务侧栏 */
  variant?: "compact" | "panel";
  className?: string;
};

export function ImportProgressPanel({
  progress,
  variant = "panel",
  className,
}: Props) {
  const pct =
    progress.total > 0
      ? Math.min(100, Math.round((progress.completed / progress.total) * 100))
      : 0;

  const extractTotal = progress.pageCount;
  const mergeTotal = Math.max(0, progress.pageCount - 1);
  const extractDone = Math.min(progress.completed, extractTotal);
  const mergeDone = Math.max(0, progress.completed - extractTotal);

  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border border-accent/30 bg-accent-soft",
        variant === "panel" ? "p-4" : "p-3",
        className,
      )}
      // 进度区域本身不可作为入口跳转
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <SpinnerGap
            size={variant === "panel" ? 18 : 16}
            className="shrink-0 animate-spin text-accent"
            weight="bold"
          />
          <p
            className={cn(
              "font-medium text-accent truncate",
              variant === "panel" ? "text-sm" : "text-xs",
            )}
          >
            正在导入
          </p>
        </div>
        {progress.accelerated && (
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-warning">
            <Lightning size={12} weight="fill" />
            加速中
          </span>
        )}
      </div>

      <p
        className={cn(
          "mt-1.5 text-muted leading-relaxed",
          variant === "panel" ? "text-xs" : "text-[11px]",
        )}
      >
        {progress.phaseLabel}
      </p>

      <div
        className={cn(
          "overflow-hidden rounded-full bg-surface",
          variant === "panel" ? "mt-3 h-1.5" : "mt-2 h-1",
        )}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div
        className={cn(
          "mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-muted",
          variant === "panel" ? "text-xs" : "text-[10px]",
        )}
      >
        <span>
          {progress.completed}/{progress.total} 任务
        </span>
        <span>{pct}%</span>
      </div>

      {variant === "panel" && progress.pageCount > 0 && (
        <div className="mt-3 grid gap-1.5 border-t border-accent/15 pt-3 text-xs text-muted">
          <div className="flex justify-between gap-2">
            <span>按页提取</span>
            <span className="font-mono">
              {extractDone}/{extractTotal}
            </span>
          </div>
          {mergeTotal > 0 && (
            <div className="flex justify-between gap-2">
              <span>跨页拼接判断</span>
              <span className="font-mono">
                {mergeDone}/{mergeTotal}
              </span>
            </div>
          )}
          <p className="mt-1 text-[11px] leading-relaxed text-muted/90">
            共 {progress.pageCount} 页提取
            {mergeTotal > 0 ? ` + ${mergeTotal} 次跨页拼接判断` : ""}
          </p>
        </div>
      )}

      {variant === "compact" && progress.pageCount > 0 && (
        <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
          {progress.pageCount} 页提取
          {mergeTotal > 0 ? ` + ${mergeTotal} 次拼接` : ""}
          {" · "}
          提取 {extractDone}/{extractTotal}
          {mergeTotal > 0 ? ` · 拼接 ${mergeDone}/${mergeTotal}` : ""}
        </p>
      )}
    </div>
  );
}
