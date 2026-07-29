"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImportProgressPanel } from "@/components/import/import-progress";
import type { Library } from "@/lib/mock-data";
import {
  FileCsv,
  UploadSimple,
  CaretRight,
  LockSimple,
  WarningCircle,
  Trash,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export function LibraryCard({
  library,
  onDelete,
}: {
  library: Library;
  onDelete?: (id: string) => void;
}) {
  const isImporting = library.status === "importing";
  const isFailed = library.status === "failed";
  const busy = isImporting || isFailed;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            busy ? "bg-surface-muted text-muted" : "bg-accent-soft text-accent",
          )}
        >
          {library.source === "csv" ? (
            <FileCsv size={22} weight="regular" />
          ) : (
            <UploadSimple size={22} weight="regular" />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {isImporting ? (
            <Badge tone="warning" className="gap-1">
              <LockSimple size={11} weight="fill" />
              正在导入
            </Badge>
          ) : isFailed ? (
            <Badge tone="danger" className="gap-1">
              <WarningCircle size={11} weight="fill" />
              导入失败
            </Badge>
          ) : (
            <Badge tone={library.source === "csv" ? "neutral" : "accent"}>
              {library.source === "csv" ? "CSV 导入" : "扫描提取"}
            </Badge>
          )}
        </div>
      </div>

      <h2
        className={cn(
          "mt-4 text-lg font-semibold leading-snug tracking-tight",
          !busy && "group-hover:text-accent",
          busy && "text-foreground/80",
        )}
      >
        {library.name}
      </h2>

      {busy && library.importProgress ? (
        <div className="mt-4">
          <ImportProgressPanel
            progress={library.importProgress}
            variant="compact"
          />
          <p className="mt-2 text-[11px] text-muted">
            {isFailed
              ? "任务失败，可删除后重新导入"
              : "导入完成前不可打开，可取消删除任务"}
          </p>
          {onDelete && (
            <Button
              size="sm"
              variant="danger"
              className="mt-3 w-full"
              icon={<Trash size={14} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(library.id);
              }}
            >
              {isImporting ? "取消并删除" : "删除失败任务"}
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            {library.questionCount} 道题 · 更新于 {library.updatedAt}
          </p>
          <div className="mt-auto flex items-center justify-between pt-5 text-sm font-medium text-accent">
            <span>查看与编辑</span>
            <CaretRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </div>
        </>
      )}
    </>
  );

  if (busy) {
    return (
      <div
        role="status"
        aria-busy={isImporting}
        aria-label={
          isFailed
            ? `${library.name} 导入失败`
            : `${library.name} 正在导入`
        }
        className={cn(
          "relative flex h-full flex-col rounded-[var(--radius)] border bg-surface p-5 shadow-[var(--shadow)]",
          isFailed ? "border-danger/30" : "border-amber-500/25",
        )}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/libraries/${library.id}`}
      className="group flex h-full flex-col rounded-[var(--radius)] border border-border bg-surface p-5 shadow-[var(--shadow)] transition-all hover:border-accent/30 hover:shadow-md active:scale-[0.995]"
    >
      {inner}
    </Link>
  );
}
