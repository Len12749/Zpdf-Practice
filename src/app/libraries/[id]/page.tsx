import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/question/question-card";
import { ImportProgressPanel } from "@/components/import/import-progress";
import { mockLibraries, mockQuestions } from "@/lib/mock-data";
import {
  ArrowLeft,
  ListChecks,
  BookOpenText,
  Plus,
  Trash,
  LockSimple,
} from "@phosphor-icons/react/dist/ssr";

export default async function LibraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lib = mockLibraries.find((l) => l.id === id) ?? mockLibraries[0];

  // 正在导入：不允许操作，仅展示与任务开始时相同的进度
  if (lib.status === "importing") {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 md:px-6">
        <Link
          href="/libraries"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} />
          返回题库
        </Link>

        <div className="mt-6 rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="flex items-center gap-2 text-warning">
            <LockSimple size={20} weight="fill" />
            <span className="text-sm font-semibold">正在导入 · 暂不可打开</span>
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">
            {lib.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            导入完成前无法查看或编辑题目，进度与任务开始时一致。
          </p>

          {lib.importProgress && (
            <div className="mt-5">
              <ImportProgressPanel
                progress={lib.importProgress}
                variant="panel"
              />
            </div>
          )}

          <Link href="/libraries" className="mt-5 block">
            <Button variant="secondary" className="w-full">
              返回列表
            </Button>
          </Link>
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
            {lib.questionCount} 道题 · 创建于 {lib.createdAt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/practice">
            <Button size="sm" icon={<ListChecks size={16} />}>
              刷题
            </Button>
          </Link>
          <Link href="/memorize">
            <Button size="sm" variant="outline" icon={<BookOpenText size={16} />}>
              背题
            </Button>
          </Link>
          <Button size="sm" variant="ghost" icon={<Plus size={16} />}>
            加题
          </Button>
          <Button size="sm" variant="ghost" icon={<Trash size={16} />}>
            删除题库
          </Button>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        删除题库将同时清除错题本与收藏夹中对应题目。
      </p>

      <div className="mt-8 space-y-4">
        {mockQuestions.map((q, i) => (
          <QuestionCard key={q.id} question={q} index={i} mode="manage" />
        ))}
      </div>
    </div>
  );
}
