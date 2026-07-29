"use client";

import { Button } from "@/components/ui/button";
import { mockLibraries } from "@/lib/mock-data";
import { cn } from "@/lib/cn";
import {
  ArrowsClockwise,
  ArrowDown,
  ArrowUp,
  Shuffle,
} from "@phosphor-icons/react";
import { useState } from "react";
import Link from "next/link";

type Order = "asc" | "desc" | "shuffle";

export function SessionSetup({
  title,
  description,
  actionLabel,
  actionHref,
  showWrongMode = true,
  empty = false,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  showWrongMode?: boolean;
  empty?: boolean;
}) {
  const [libraryId, setLibraryId] = useState(mockLibraries[0]?.id ?? "");
  const [order, setOrder] = useState<Order>("asc");
  const [wrongMode, setWrongMode] = useState(false);

  if (empty) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:px-6">
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface p-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            还没有题库，无法开始。请先创建或导入一个题库。
          </p>
          <Link href="/libraries/new" className="mt-6 inline-block">
            <Button>去创建题库</Button>
          </Link>
        </div>
      </div>
    );
  }

  const orders: { id: Order; label: string; icon: React.ReactNode }[] = [
    { id: "asc", label: "顺序", icon: <ArrowDown size={16} /> },
    { id: "desc", label: "逆序", icon: <ArrowUp size={16} /> },
    { id: "shuffle", label: "乱序", icon: <Shuffle size={16} /> },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        {description}
      </p>

      <div className="mt-8 space-y-6 rounded-[var(--radius)] border border-border bg-surface p-5 shadow-[var(--shadow)] md:p-6">
        <div>
          <label className="text-sm font-medium">选择题库</label>
          <select
            value={libraryId}
            onChange={(e) => setLibraryId(e.target.value)}
            className="mt-2 h-11 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {mockLibraries.map((lib) => (
              <option key={lib.id} value={lib.id}>
                {lib.name}（{lib.questionCount} 题）
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-medium">出题顺序</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {orders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOrder(o.id)}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border text-sm font-medium transition-colors",
                  order === o.id
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border hover:bg-surface-muted",
                )}
              >
                {o.icon}
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {showWrongMode && (
          <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border border-border p-3.5 hover:bg-surface-muted/50">
            <input
              type="checkbox"
              checked={wrongMode}
              onChange={(e) => setWrongMode(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span>
              <span className="block text-sm font-medium">错题巩固模式</span>
              <span className="mt-0.5 block text-xs text-muted">
                仅从该题库的错题本中出题，优先巩固薄弱点
              </span>
            </span>
          </label>
        )}

        <Link href={actionHref} className="block">
          <Button className="w-full" size="lg" icon={<ArrowsClockwise size={18} />}>
            {actionLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
