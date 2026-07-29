"use client";

import { Suspense } from "react";
import { QuestionSession } from "@/components/session/question-session";

export default function MemorizeSessionPage() {
  return (
    <Suspense>
      <QuestionSession mode="memorize" exitHref="/memorize" />
    </Suspense>
  );
}
