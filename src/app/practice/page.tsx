"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SessionSetup } from "@/components/session/session-setup";

function Inner() {
  const sp = useSearchParams();
  return (
    <SessionSetup
      title="刷题"
      description="手动选择选项后提交。答错自动记入错题本并累计错误次数。"
      actionLabel="开始刷题"
      mode="practice"
      initialLibraryId={sp.get("libraryId") ?? undefined}
    />
  );
}

export default function PracticePage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
