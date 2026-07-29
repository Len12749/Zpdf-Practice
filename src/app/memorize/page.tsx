"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SessionSetup } from "@/components/session/session-setup";

function Inner() {
  const sp = useSearchParams();
  return (
    <SessionSetup
      title="背题"
      description="直接显示答案与解析，适合快速过题。"
      actionLabel="开始背题"
      mode="memorize"
      initialLibraryId={sp.get("libraryId") ?? undefined}
    />
  );
}

export default function MemorizePage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
