"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Books, CaretDown, Check, SealQuestion } from "@phosphor-icons/react";

export type LibrarySelectItem = {
  id: string;
  name: string;
  questionCount?: number;
  /** 可选副标题，例如错题数 */
  meta?: string;
};

export function LibrarySelect({
  label = "选择题库",
  libraries,
  value,
  onChange,
  emptyText = "暂无可用题库",
  className,
}: {
  label?: string;
  libraries: LibrarySelectItem[];
  value: string;
  onChange: (id: string) => void;
  emptyText?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = libraries.find((l) => l.id === value);

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

  if (!libraries.length) {
    return (
      <div className={className}>
        {label && <p className="text-sm font-medium">{label}</p>}
        <div className="mt-2 flex h-12 items-center rounded-[var(--radius-sm)] border border-dashed border-border bg-surface-muted/40 px-3 text-sm text-muted">
          {emptyText}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="text-sm font-medium" id={`${listboxId}-label`}>
          {label}
        </label>
      )}
      <div ref={rootRef} className={cn("relative", label && "mt-2")}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={label ? `${listboxId}-label` : undefined}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-12 w-full items-center gap-3 rounded-[var(--radius-sm)] border bg-background px-3 text-left transition-colors",
            "hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
            open ? "border-accent ring-2 ring-accent/20" : "border-border",
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
              <span className="mt-0.5 block truncate text-xs text-muted">
                {selected.meta ??
                  (selected.questionCount != null
                    ? `${selected.questionCount} 道题`
                    : null)}
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
            aria-labelledby={label ? `${listboxId}-label` : undefined}
            className="absolute left-0 right-0 z-30 mt-1.5 max-h-60 overflow-y-auto rounded-[var(--radius-sm)] border border-border bg-surface p-1 shadow-[var(--shadow)]"
          >
            {libraries.map((lib) => {
              const active = value === lib.id;
              return (
                <li key={lib.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(lib.id);
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
                        {lib.meta ??
                          (lib.questionCount != null
                            ? `${lib.questionCount} 道题`
                            : "")}
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
  );
}
