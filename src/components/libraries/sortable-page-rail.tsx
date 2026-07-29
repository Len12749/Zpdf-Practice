"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import {
  CaretDown,
  CaretUp,
  DotsSixVertical,
  Trash,
} from "@phosphor-icons/react";

export type SortablePage = {
  id: string;
  url: string;
  label: string;
};

type DragVisual = {
  id: string;
  /** 卡片左上角相对视口 */
  x: number;
  y: number;
  width: number;
  height: number;
  /** 指针相对卡片左上角的偏移，保持抓取点 */
  grabX: number;
  grabY: number;
  url: string;
  label: string;
  indexLabel: string;
};

/**
 * 页面缩略图轨道：指针拖拽跟随鼠标，松手落在最近槽位。
 * 不用 HTML5 DnD（只有 ghost 轮廓、松手才换位）。
 */
export function SortablePageRail({
  pages,
  activeId,
  disabled,
  onReorder,
  onSelect,
  onMove,
  onRemove,
}: {
  pages: SortablePage[];
  activeId: string | null;
  disabled?: boolean;
  onReorder: (fromId: string, toId: string) => void;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const dragRef = useRef<DragVisual | null>(null);
  const [drag, setDrag] = useState<DragVisual | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  /** 根据指针位置算目标下标（落到最近槽：越过卡片中线即换位） */
  const findTargetIndex = useCallback(
    (clientX: number, clientY: number, dragId: string) => {
      const list = pagesRef.current;
      if (!list.length) return 0;

      const vertical =
        typeof window !== "undefined" &&
        window.matchMedia("(min-width: 768px)").matches;

      const pos = vertical ? clientY : clientX;

      for (let i = 0; i < list.length; i++) {
        const el = itemRefs.current.get(list[i].id);
        if (!el?.isConnected) continue;
        const r = el.getBoundingClientRect();
        const mid = vertical
          ? r.top + r.height / 2
          : r.left + r.width / 2;
        if (pos < mid) return i;
      }
      return list.length - 1;
    },
    [],
  );

  const applyDragToIndex = useCallback((dragId: string, toIndex: number) => {
    const list = pagesRef.current;
    const from = list.findIndex((p) => p.id === dragId);
    if (from < 0 || from === toIndex) return;
    // 复用「拖到 toId」：用目标下标对应的 id
    const toId = list[toIndex]?.id;
    if (!toId || toId === dragId) return;
    onReorderRef.current(dragId, toId);
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDrag(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    if (!drag) return;

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      e.preventDefault();

      const next: DragVisual = {
        ...d,
        x: e.clientX - d.grabX,
        y: e.clientY - d.grabY,
      };
      dragRef.current = next;
      setDrag(next);

      const toIndex = findTargetIndex(e.clientX, e.clientY, d.id);
      applyDragToIndex(d.id, toIndex);
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (d) {
        const toIndex = findTargetIndex(e.clientX, e.clientY, d.id);
        applyDragToIndex(d.id, toIndex);
      }
      endDrag();
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [drag, endDrag, findTargetIndex, applyDragToIndex]);

  const startDrag = (
    e: React.PointerEvent,
    page: SortablePage,
    index: number,
  ) => {
    if (disabled || e.button !== 0) return;
    // 只从把手开始，避免和预览点击冲突；但把手会 setPointerCapture
    const li = itemRefs.current.get(page.id);
    if (!li) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = li.getBoundingClientRect();
    const visual: DragVisual = {
      id: page.id,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      grabX: e.clientX - rect.left,
      grabY: e.clientY - rect.top,
      url: page.url,
      label: page.label,
      indexLabel: String(index + 1),
    };
    dragRef.current = visual;
    setDrag(visual);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <ul
        ref={listRef}
        className="flex gap-2 overflow-x-auto pb-1 md:max-h-[560px] md:flex-col md:overflow-y-auto md:pr-1"
      >
        {pages.map((page, i) => {
          const active = activeId === page.id;
          const isDragging = drag?.id === page.id;
          return (
            <li
              key={page.id}
              data-page-id={page.id}
              ref={(el) => {
                if (el) itemRefs.current.set(page.id, el);
                else itemRefs.current.delete(page.id);
              }}
              className={cn(
                "relative shrink-0 rounded-xl border bg-background p-1.5 transition-[box-shadow,border-color] duration-150",
                active ? "border-accent shadow-sm" : "border-border",
                isDragging && "border-dashed border-accent/40 bg-accent-soft/30",
              )}
            >
              {/* 占位：拖起后原位留空槽，避免列表塌缩 */}
              <div
                className={cn(
                  "transition-opacity duration-100",
                  isDragging && "opacity-0",
                )}
              >
                <div className="flex items-start gap-1">
                  <button
                    type="button"
                    disabled={disabled}
                    onPointerDown={(e) => startDrag(e, page, i)}
                    className="mt-1 flex h-7 w-5 shrink-0 touch-none cursor-grab items-center justify-center rounded text-muted active:cursor-grabbing hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
                    aria-label="拖动排序"
                    title="按住拖动"
                  >
                    <DotsSixVertical size={14} weight="bold" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelect(page.id)}
                    className="min-w-0 flex-1 overflow-hidden rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={page.url}
                      alt={page.label}
                      draggable={false}
                      className="pointer-events-none aspect-[3/4] w-full object-cover"
                    />
                  </button>
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-0.5">
                  <span className="font-mono text-[10px] text-muted">
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={disabled || i === 0}
                      onClick={() => onMove(page.id, -1)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
                      aria-label="上移"
                    >
                      <CaretUp size={12} weight="bold" />
                    </button>
                    <button
                      type="button"
                      disabled={disabled || i === pages.length - 1}
                      onClick={() => onMove(page.id, 1)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
                      aria-label="下移"
                    >
                      <CaretDown size={12} weight="bold" />
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onRemove(page.id)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-danger hover:bg-danger/10 disabled:opacity-30"
                      aria-label="删除此页"
                    >
                      <Trash size={12} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>

              {isDragging && (
                <div
                  className="pointer-events-none absolute inset-1.5 rounded-lg border border-dashed border-accent/35 bg-accent-soft/20"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ul>

      {mounted &&
        drag &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[300] will-change-transform"
            style={{
              left: 0,
              top: 0,
              width: drag.width,
              height: drag.height,
              transform: `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(2.5deg) scale(1.04)`,
            }}
          >
            <div className="h-full w-full overflow-hidden rounded-xl border-2 border-accent bg-surface p-1.5 shadow-2xl ring-2 ring-accent/20">
              <div className="flex items-start gap-1">
                <span className="mt-1 flex h-7 w-5 shrink-0 items-center justify-center text-accent">
                  <DotsSixVertical size={14} weight="bold" />
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={drag.url}
                  alt=""
                  className="aspect-[3/4] min-w-0 flex-1 rounded-lg object-cover"
                />
              </div>
              <p className="mt-1 text-center font-mono text-[10px] text-muted">
                {drag.indexLabel}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
