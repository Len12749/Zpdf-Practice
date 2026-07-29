"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useAuth, todayKey } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  Lightning,
  X,
} from "@phosphor-icons/react";

const WEEK = ["一", "二", "三", "四", "五", "六", "日"];

export function CheckInModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { checkedDays, checkedInToday, streak, speedTickets, checkIn } =
    useAuth();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 打开时锁 body 滚动，避免 sticky header 干扰
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const list: ({ day: number; key: string } | null)[] = [];
    for (let i = 0; i < startPad; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      list.push({ day: d, key });
    }
    return list;
  }, [view]);

  const monthLabel = `${view.y}年${view.m + 1}月`;
  const today = todayKey();
  // 每连续 3 天发 1 张：streak%3===0 时下一张还需再连续 3 天
  const daysToNextTicket =
    streak % 3 === 0 ? 3 : 3 - (streak % 3);

  if (!open || !mounted) return null;

  const onCheckIn = async () => {
    setBusy(true);
    try {
      const res = await checkIn();
      setToast(res.message);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "签到失败");
    } finally {
      setBusy(false);
    }
  };

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/55 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="签到"
    >
      <div
        className="max-h-[min(90dvh,640px)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">每日签到</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              每连续签到 3 天可获得 1 张加速券。距离下次获得加速券还差{" "}
              <span className="font-semibold text-accent">
                {daysToNextTicket}
              </span>{" "}
              天。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-muted"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[var(--radius-sm)] border border-border bg-surface-muted/60 px-3 py-2.5">
            <p className="text-[11px] text-muted">连续签到</p>
            <p className="mt-0.5 font-mono text-xl font-semibold text-accent">
              {streak}
              <span className="ml-0.5 text-sm font-normal text-muted">天</span>
            </p>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-border bg-surface-muted/60 px-3 py-2.5">
            <p className="text-[11px] text-muted">加速券</p>
            <p className="mt-0.5 flex items-center gap-1 font-mono text-xl font-semibold">
              <Lightning size={18} className="text-warning" weight="fill" />
              {speedTickets}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-muted"
              aria-label="上个月"
            >
              <CaretLeft size={16} />
            </button>
            <span className="text-sm font-medium">{monthLabel}</span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-muted"
              aria-label="下个月"
            >
              <CaretRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
            {WEEK.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="mt-0.5 grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (!cell) return <div key={`e-${i}`} />;
              const done = checkedDays.has(cell.key);
              const isToday = cell.key === today;
              return (
                <div
                  key={cell.key}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-lg text-xs font-medium",
                    done && "bg-accent text-white dark:text-zinc-950",
                    !done && isToday && "border border-accent/50 text-accent",
                    !done && !isToday && "text-foreground/80",
                  )}
                >
                  {cell.day}
                  {done && (
                    <CheckCircle
                      size={10}
                      weight="fill"
                      className="absolute bottom-0.5 right-0.5 opacity-80"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {toast && (
          <p className="mt-3 rounded-[var(--radius-sm)] bg-accent-soft px-3 py-2 text-xs text-accent">
            {toast}
          </p>
        )}

        <Button
          className="mt-4 w-full"
          size="lg"
          disabled={checkedInToday || busy}
          onClick={() => void onCheckIn()}
          icon={
            checkedInToday ? (
              <CheckCircle size={18} weight="fill" />
            ) : undefined
          }
        >
          {checkedInToday ? "今日已签到" : busy ? "签到中…" : "立即签到"}
        </Button>
      </div>
    </div>
  );

  // 挂到 body，避免 sticky header / backdrop-blur 导致 fixed 定位错位
  return createPortal(modal, document.body);
}
