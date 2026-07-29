"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionCard, type QuestionView } from "@/components/question/question-card";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/client-api";
import { useAuth } from "@/lib/auth-store";
import { Heart } from "@phosphor-icons/react";

export default function FavoritesPage() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [qs, setQs] = useState<(QuestionView & { libraryId?: string })[]>([]);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void api<{ questions: (QuestionView & { libraryId?: string })[] }>(
      "/api/favorites",
    ).then((d) => setQs(d.questions));
  }, [isLoggedIn]);

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">收藏夹</h1>
      <p className="mt-2 text-sm text-muted">
        在题目卡片上点击心形即可收藏。删除题库后对应收藏会清除。
      </p>

      {!qs.length ? (
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
          {qs.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={{ ...q, favorited: true }}
              index={i}
              mode="memorize"
              libraryId={q.libraryId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
