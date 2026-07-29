"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionCard } from "@/components/question/question-card";
import { api } from "@/lib/client-api";
import { useAuth } from "@/lib/auth-store";
import { ArrowLeft, CheckCircle, Sparkle } from "@phosphor-icons/react";

type Q = {
  id: string;
  stem: string;
  options: { key: string; text: string }[];
  answer: string[];
  explanation: string;
  type: "single" | "multiple";
  aiGeneratedAnswer: boolean;
  aiGeneratedExplanation: boolean;
};

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [qs, setQs] = useState<Q[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn || !id) return;
    void api<{
      library: { name: string; status: string };
      questions: Q[];
      locked: boolean;
    }>(`/api/libraries/${id}`).then((data) => {
      if (data.locked || data.library.status === "importing") {
        router.replace(`/libraries/${id}`);
        return;
      }
      setName(data.library.name);
      setQs(data.questions);
    });
  }, [isLoggedIn, id, router]);

  const aiCount = qs.filter(
    (q) => Boolean(q.aiGeneratedAnswer) || Boolean(q.aiGeneratedExplanation),
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
            {name} · 修改答案/解析后 AI 标识会取消
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {aiCount > 0 && (
            <Badge tone="warning">
              <Sparkle size={12} weight="fill" className="mr-1" />
              {aiCount} 题含 AI 补全
            </Badge>
          )}
          <Link href={`/libraries/${id}`}>
            <Button icon={<CheckCircle size={18} weight="fill" />}>
              确认入库
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {qs.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            mode="manage"
            libraryId={id}
            onDeleted={() =>
              setQs((list) => list.filter((x) => x.id !== q.id))
            }
            onUpdated={() => {
              void api<{ questions: Q[] }>(`/api/libraries/${id}`).then(
                (d) => setQs(d.questions),
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}
