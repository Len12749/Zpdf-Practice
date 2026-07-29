"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ImportProgressPanel } from "@/components/import/import-progress";
import type { Library } from "@/lib/mock-data";
import {
  FileCsv,
  UploadSimple,
  CaretRight,
  LockSimple,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export function LibraryCard({ library }: { library: Library }) {
  const isImporting = library.status === "importing";

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            isImporting
              ? "bg-surface-muted text-muted"
              : "bg-accent-soft text-accent",
          )}
        >
          {library.source === "csv" ? (
            <FileCsv size={22} weight="duotone" />
          ) : (
            <UploadSimple size={22} weight="duotone" />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {isImporting ? (
            <Badge tone="warning" className="gap-1">
              <LockSimple size={11} weight="fill" />
              正在导入
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
          !isImporting && "group-hover:text-accent",
          isImporting && "text-foreground/80",
        )}
      >
        {library.name}
      </h2>

      {isImporting && library.importProgress ? (
        <div className="mt-4">
          <ImportProgressPanel
            progress={library.importProgress}
            variant="compact"
          />
          <p className="mt-2 text-[11px] text-muted">
            导入完成前不可打开题库，请稍候
          </p>
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

  if (isImporting) {
    return (
      <div
        role="status"
        aria-disabled="true"
        aria-busy="true"
        aria-label={`${library.name} 正在导入，不可打开`}
        className={cn(
          "relative flex h-full flex-col rounded-[var(--radius)] border border-amber-500/25 bg-surface p-5 shadow-[var(--shadow)]",
          "cursor-not-allowed select-none",
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
