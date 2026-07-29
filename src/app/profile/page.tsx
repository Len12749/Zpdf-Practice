"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockUser } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import {
  Envelope,
  Lightning,
  FolderOpen,
  User,
  SignOut,
} from "@phosphor-icons/react";

export default function ProfilePage() {
  const { isLoggedIn, speedTickets, streak, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(mockUser.email);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-muted">请先登录</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button>去登录</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">个人中心</h1>
      <p className="mt-2 text-sm text-muted">管理账号信息与加速券</p>

      <div className="mt-8 space-y-4">
        <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <User size={24} weight="duotone" />
            </div>
            <div>
              <p className="font-semibold">{mockUser.account}</p>
              <p className="text-xs text-muted">登录账号</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-muted">
              <Lightning size={18} className="text-warning" weight="fill" />
              <span className="text-xs">加速券</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold">
              {speedTickets}
            </p>
            <p className="mt-1 text-xs text-muted">连续 3 天签到得 1 张</p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-muted">
              <FolderOpen size={18} className="text-accent" />
              <span className="text-xs">连续签到</span>
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold">
              {streak}
              <span className="text-base font-normal text-muted"> 天</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              题库 {mockUser.libraryCount}/{mockUser.libraryLimit}
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Envelope size={18} className="text-accent" />
            <h2 className="text-sm font-semibold">联系邮箱</h2>
            <Badge tone="neutral">可修改</Badge>
          </div>
          <Input
            label="邮箱地址"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSaved(false);
            }}
            hint="用于我们与您联系，无需验证"
          />
          <Button
            className="mt-4"
            onClick={() => setSaved(true)}
            disabled={!email.trim()}
          >
            {saved ? "已保存（演示）" : "保存邮箱"}
          </Button>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-border bg-surface-muted p-4 text-xs leading-relaxed text-muted">
          任务加速券通过连续 3 天签到获得，只能在 AI
          提取任务开始时勾选使用，可将提取速率提升至四倍。
        </div>

        <Button
          variant="outline"
          className="w-full"
          icon={<SignOut size={18} />}
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          退出登录
        </Button>
      </div>
    </div>
  );
}
