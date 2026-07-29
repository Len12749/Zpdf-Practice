import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

/**
 * 全部实体按钮，禁止半透明/纯透明底。
 */
const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover dark:text-zinc-950 shadow-sm",
  secondary:
    "bg-surface-muted text-foreground border border-border hover:bg-border shadow-sm",
  // 与 secondary 同级可见度，仅 hover 略浅
  ghost:
    "bg-surface-muted text-foreground border border-border hover:bg-border shadow-sm",
  danger: "bg-danger text-white hover:opacity-90 shadow-sm",
  outline:
    "bg-surface-muted text-foreground border-2 border-border hover:border-accent/50 hover:bg-surface shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  icon,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-sm)] font-medium transition-all duration-200",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        "whitespace-nowrap",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
