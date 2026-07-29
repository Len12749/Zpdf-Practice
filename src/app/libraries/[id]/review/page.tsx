import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "@/components/question/question-card";
import { mockQuestions } from "@/lib/mock-data";
import { ArrowLeft, CheckCircle, Sparkle } from "@phosphor-icons/react/dist/ssr";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const aiCount = mockQuestions.filter(
    (q) => q.aiGeneratedAnswer || q.aiGeneratedExplanation,
  ).length;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-6 md:py-10">
      <Link
        href={`/libraries/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} />
        返回题库
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            题目复审
          </h1>
          <p className="mt-2 text-sm text-muted">
            可增删改题目。修改答案或解析后，AI 生成标识会自动取消。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="warning">
            <Sparkle size={12} weight="fill" className="mr-1" />
            {aiCount} 题含 AI 补全
          </Badge>
          <Link href={`/libraries/${id}`}>
            <Button icon={<CheckCircle size={18} weight="fill" />}>
              确认入库
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-[var(--radius-sm)] border border-border bg-surface-muted px-4 py-3 text-xs leading-relaxed text-muted">
        不完整的题目已自动过滤。请重点检查带「AI 生成」标记的题目。
      </div>

      <div className="mt-8 space-y-4">
        {mockQuestions.map((q, i) => (
          <QuestionCard key={q.id} question={q} index={i} mode="manage" />
        ))}
      </div>
    </div>
  );
}
