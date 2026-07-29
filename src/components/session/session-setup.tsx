"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import {
  ArrowDown,
  ArrowUp,
  Shuffle,
  ArrowsClockwise,
  Books,
  CaretDown,
  Check,
  SealQuestion,
} from "@phosphor-icons/react";

type Order = "asc" | "desc" | "shuffle";
type Lib = { id: string; name: string; questionCount: number; status: string };

export function SessionSetup({
  title,
  description,
  actionLabel,
  mode,
  initialLibraryId,
}: {
  title: string;
  description: string;
  actionLabel: string;
  mode: "practice" | "memorize";
  initialLibraryId?: string;
}) {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [libs, setLibs] = useState<Lib[]>([]);
  const [libraryId, setLibraryId] = useState(initialLibraryId ?? "");
  const [order, setOrder] = useState<Order>("asc");
  const [wrongMode, setWrongMode] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void api<{ libraries: Lib[] }>("/api/libraries").then((d) => {
      const ready = d.libraries.filter(
        (l) => l.status === "ready" && l.questionCount > 0,
      );
      setLibs(ready);
      setLibraryId((prev) => {
        if (prev && ready.some((l) => l.id === prev)) return prev;
        return ready[0]?.id ?? "";
      });
      setLoaded(true);
    });
  }, [isLoggedIn]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading || !isLoggedIn || !loaded) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-muted md:px-6">
        加载中…
      </div>
    );
  }

  if (!libs.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:px-6">
        <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-muted">
            <Books size={26} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            还没有可用题库，无法开始。请先创建或导入一个题库。
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

  const href = `/${mode}/session?libraryId=${libraryId}&order=${order}${wrongMode ? "&wrongOnly=1" : ""}`;
  const selected = libs.find((l) => l.id === libraryId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        {description}
      </p>

      <div className="mt-8 space-y-6 rounded-[var(--radius)] border border-border bg-surface p-5 shadow-[var(--shadow)] md:p-6">
        <div>
          <label className="text-sm font-medium" id={`${listboxId}-label`}>
            选择题库
          </label>

          <div ref={rootRef} className="relative mt-2">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-labelledby={`${listboxId}-label`}
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "flex h-12 w-full items-center gap-3 rounded-[var(--radius-sm)] border bg-background px-3 text-left transition-colors",
                "hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                open
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-border",
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Books size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {selected?.name ?? "请选择题库"}
                </span>
                {selected && (
                  <span className="mt-0.5 block text-xs text-muted">
                    {selected.questionCount} 道题
                  </span>
                )}
              </span>
              <CaretDown
                size={16}
                className={cn(
                  "shrink-0 text-muted transition-transform duration-200",
                  open && "rotate-180",
                )}
              />
            </button>

            {open && (
              <ul
                id={listboxId}
                role="listbox"
                aria-labelledby={`${listboxId}-label`}
                className="absolute left-0 right-0 z-30 mt-1.5 max-h-60 overflow-y-auto rounded-[var(--radius-sm)] border border-border bg-surface p-1 shadow-[var(--shadow)]"
              >
                {libs.map((lib) => {
                  const active = libraryId === lib.id;
                  return (
                    <li key={lib.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setLibraryId(lib.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left transition-colors",
                          active
                            ? "bg-accent-soft text-accent"
                            : "hover:bg-surface-muted",
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {lib.name}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                            <SealQuestion size={12} />
                            {lib.questionCount} 道题
                          </span>
                        </span>
                        {active && (
                          <Check
                            size={16}
                            weight="bold"
                            className="shrink-0 text-accent"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
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

        <button
          type="button"
          onClick={() => setWrongMode((v) => !v)}
          className={cn(
            "flex w-full items-start gap-3 rounded-[var(--radius-sm)] border p-3.5 text-left transition-colors",
            wrongMode
              ? "border-warning/40 bg-warning/5"
              : "border-border hover:bg-surface-muted/50",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
              wrongMode
                ? "border-warning bg-warning text-white"
                : "border-border bg-background",
            )}
            aria-hidden
          >
            {wrongMode && <Check size={12} weight="bold" />}
          </span>
          <span>
            <span className="block text-sm font-medium">错题巩固模式</span>
            <span className="mt-0.5 block text-xs text-muted">
              仅从该题库的错题本中出题
            </span>
          </span>
        </button>

        <Link href={href} className="block">
          <Button
            className="w-full"
            size="lg"
            disabled={!libraryId}
            icon={<ArrowsClockwise size={18} />}
          >
            {actionLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
