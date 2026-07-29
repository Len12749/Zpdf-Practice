import { QuestionCard } from "@/components/question/question-card";
import { EmptyState } from "@/components/ui/empty-state";
import { mockQuestions } from "@/lib/mock-data";
import { Heart } from "@phosphor-icons/react/dist/ssr";

export default function FavoritesPage() {
  const favs = mockQuestions.filter((q) => q.favorited);

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">收藏夹</h1>
      <p className="mt-2 text-sm text-muted">
        在刷题、背题、题库管理等任意题目卡片上均可收藏。题库删除后对应收藏同步清除。
      </p>

      {favs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Heart size={28} />}
            title="还没有收藏"
            description="在题目右上角点击心形即可加入收藏夹。"
            actionLabel="去题库看看"
            actionHref="/libraries"
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {favs.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i} mode="memorize" />
          ))}
        </div>
      )}
    </div>
  );
}
