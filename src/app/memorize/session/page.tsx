"use client";

import { QuestionSession } from "@/components/session/question-session";
import { mockLibraries, mockQuestions } from "@/lib/mock-data";

export default function MemorizeSessionPage() {
  return (
    <QuestionSession
      questions={mockQuestions}
      library={mockLibraries[0]}
      mode="memorize"
      exitHref="/memorize"
      subtitle={`${mockLibraries[0].name} · 背题模式`}
    />
  );
}
