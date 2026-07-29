"use client";

import { QuestionSession } from "@/components/session/question-session";
import { mockLibraries, mockQuestions } from "@/lib/mock-data";

export default function PracticeSessionPage() {
  return (
    <QuestionSession
      questions={mockQuestions}
      library={mockLibraries[0]}
      mode="practice"
      exitHref="/practice"
    />
  );
}
