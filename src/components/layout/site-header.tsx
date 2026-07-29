"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  Brain,
  CalendarCheck,
  FolderOpen,
  Heart,
  ListChecks,
  SealQuestion,
  UserCircle,
  X,
  List,
} from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/logo";
import { CheckInModal } from "@/components/check-in/check-in-card";
import { useAuth } from "@/lib/auth-store";

const nav = [
  { href: "/libraries", label: "题库", icon: FolderOpen },
  { href: "/memorize", label: "背题", icon: BookOpenText },
  { href: "/practice", label: "刷题", icon: ListChecks },
  { href: "/wrong", label: "错题本", icon: SealQuestion },
  { href: "/favorites", label: "收藏", icon: Heart },
  { href: "/about", label: "关于", icon: Brain },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const { isLoggedIn, checkedInToday } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandLogo size={32} priority className="h-8 w-8" />
          <span className="text-[15px] font-semibold tracking-tight">
            Zpdf-Practice
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <Icon size={16} weight={active ? "fill" : "regular"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Button
                variant={checkedInToday ? "secondary" : "outline"}
                size="sm"
                icon={<CalendarCheck size={18} weight={checkedInToday ? "fill" : "regular"} />}
                onClick={() => setCheckInOpen(true)}
                className="hidden sm:inline-flex"
              >
                {checkedInToday ? "已签到" : "签到"}
              </Button>
              <button
                type="button"
                onClick={() => setCheckInOpen(true)}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg border sm:hidden",
                  checkedInToday
                    ? "border-border bg-surface-muted text-muted"
                    : "border-accent/40 text-accent",
                )}
                aria-label={checkedInToday ? "查看签到" : "签到"}
              >
                <CalendarCheck
                  size={18}
                  weight={checkedInToday ? "fill" : "regular"}
                />
              </button>
              <Link href="/profile" className="hidden sm:block">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<UserCircle size={18} />}
                >
                  个人中心
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/login" className="hidden sm:block">
              <Button size="sm">登录</Button>
            </Link>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "关闭菜单" : "打开菜单"}
          >
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-surface px-4 py-3 lg:hidden">
          <div className="grid grid-cols-2 gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-foreground hover:bg-surface-muted",
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setCheckInOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-surface-muted"
                >
                  <CalendarCheck size={18} />
                  {checkedInToday ? "已签到" : "签到"}
                </button>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface-muted"
                >
                  <UserCircle size={18} />
                  个人中心
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-accent"
              >
                登录 / 注册
              </Link>
            )}
          </div>
        </div>
      )}

      <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </header>
  );
}
