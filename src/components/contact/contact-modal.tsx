"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatsCircle, Copy, Lightning, X } from "@phosphor-icons/react";
import { useFeedback } from "@/components/ui/feedback";

export const QQ_GROUP = "160804101";

export function ContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useFeedback();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[180] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="关闭"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <ChatsCircle size={24} />
            </span>
            <div>
              <h2 id="contact-title" className="text-lg font-semibold">
                联系我们
              </h2>
              <p className="mt-0.5 text-xs text-muted">加入 QQ 群获取支持</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-[var(--radius-sm)] border border-border bg-background p-4">
          <p className="text-xs text-muted">QQ 群号</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-wide">
            {QQ_GROUP}
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-accent-soft/70 px-3 py-2.5 text-sm text-accent">
            <Lightning size={16} weight="fill" className="mt-0.5 shrink-0" />
            <span>入群可领加速券</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            className="flex-1"
            icon={<Copy size={16} />}
            onClick={() => {
              void navigator.clipboard
                .writeText(QQ_GROUP)
                .then(() => toast("群号已复制", "success"))
                .catch(() => toast("复制失败，请手动复制", "error"));
            }}
          >
            复制群号
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
