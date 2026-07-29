import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "warning" | "danger" | "success";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-muted border-border",
  accent: "bg-accent-soft text-accent border-accent/20",
  warning: "bg-amber-500/10 text-warning border-amber-500/20",
  danger: "bg-red-500/10 text-danger border-red-500/20",
  success: "bg-emerald-500/10 text-success border-emerald-500/20",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
