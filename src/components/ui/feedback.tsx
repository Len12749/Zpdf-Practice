"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  CheckCircle,
  WarningCircle,
  Info,
  X,
} from "@phosphor-icons/react";

type ToastTone = "info" | "success" | "error" | "warning";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ConfirmOpts = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type FeedbackContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used within FeedbackProvider");
  return ctx;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOpts;
    resolve: (v: boolean) => void;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!confirmState) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [confirmState]);

  const toast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const confirm = useCallback((opts: ConfirmOpts) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ opts, resolve });
    });
  }, []);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  const toneIcon = {
    info: <Info size={18} weight="fill" className="text-accent" />,
    success: <CheckCircle size={18} weight="fill" className="text-success" />,
    error: <WarningCircle size={18} weight="fill" className="text-danger" />,
    warning: <WarningCircle size={18} weight="fill" className="text-warning" />,
  };

  const toneBorder = {
    info: "border-accent/30",
    success: "border-success/35",
    error: "border-danger/35",
    warning: "border-warning/35",
  };

  const portal =
    mounted &&
    createPortal(
      <>
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 sm:items-end">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface px-4 py-3 shadow-[var(--shadow)]",
                toneBorder[t.tone],
              )}
              role="status"
            >
              <span className="mt-0.5 shrink-0">{toneIcon[t.tone]}</span>
              <p className="flex-1 text-sm leading-relaxed text-foreground">
                {t.message}
              </p>
              <button
                type="button"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted text-muted hover:text-foreground"
                onClick={() =>
                  setToasts((list) => list.filter((x) => x.id !== t.id))
                }
                aria-label="关闭"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {confirmState && (
          <div
            className="fixed inset-0 z-[210] flex items-center justify-center bg-zinc-950/55 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => {
              confirmState.resolve(false);
              setConfirmState(null);
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow)] sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold tracking-tight">
                {confirmState.opts.title}
              </h2>
              {confirmState.opts.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {confirmState.opts.description}
                </p>
              )}
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    confirmState.resolve(false);
                    setConfirmState(null);
                  }}
                >
                  {confirmState.opts.cancelLabel ?? "取消"}
                </Button>
                <Button
                  variant={confirmState.opts.danger ? "danger" : "primary"}
                  className={
                    confirmState.opts.danger
                      ? "bg-danger text-white hover:opacity-90"
                      : undefined
                  }
                  onClick={() => {
                    confirmState.resolve(true);
                    setConfirmState(null);
                  }}
                >
                  {confirmState.opts.confirmLabel ?? "确定"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body,
    );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {portal}
    </FeedbackContext.Provider>
  );
}
