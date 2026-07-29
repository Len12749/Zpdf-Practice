import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LibraryCard } from "@/components/libraries/library-card";
import { mockLibraries, mockUser } from "@/lib/mock-data";
import { FolderOpen, Plus, FileCsv } from "@phosphor-icons/react/dist/ssr";

export default function LibrariesPage() {
  const libs = mockLibraries;
  const hasLibs = libs.length > 0;
  const importingCount = libs.filter((l) => l.status === "importing").length;
  // 导入中的题库也占用名额
  const usedSlots = mockUser.libraryCount + importingCount > mockUser.libraryLimit
    ? mockUser.libraryLimit
    : Math.max(mockUser.libraryCount, libs.length);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-6 md:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">题库管理</h1>
          <p className="mt-2 text-sm text-muted">
            已用 {usedSlots} / {mockUser.libraryLimit} 个题库名额
            {importingCount > 0 && (
              <span className="text-warning">
                {" "}
                · {importingCount} 个正在导入
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
          <span className="font-mono text-foreground">
            {usedSlots}/{mockUser.libraryLimit}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{
              width: `${(usedSlots / mockUser.libraryLimit) * 100}%`,
            }}
          />
        </div>
      </div>

      {!hasLibs ? (
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
              <LibraryCard library={lib} />
            </li>
          ))}

          {usedSlots < mockUser.libraryLimit && (
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
