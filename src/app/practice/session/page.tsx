"use client";

import { Suspense } from "react";
import { QuestionSession } from "@/components/session/question-session";

export default function PracticeSessionPage() {
  return (
    <Suspense>
      <QuestionSession mode="practice" exitHref="/practice" />
    </Suspense>
  );
}
