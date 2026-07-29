"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-store";
import {
  Envelope,
  Lightning,
  User,
  SignOut,
} from "@phosphor-icons/react";

export default function ProfilePage() {
  const { isLoggedIn, loading, user, streak, logout, updateEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/login");
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted">
        加载中…
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
              <User size={24} />
            </div>
            <div>
              <p className="font-semibold">{user.account}</p>
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
              {user.speedTickets}
            </p>
            <p className="mt-1 text-xs text-muted">连续 3 天签到得 1 张</p>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
            <p className="text-xs text-muted">连续签到</p>
            <p className="mt-2 font-mono text-2xl font-semibold">
              {streak}
              <span className="text-base font-normal text-muted"> 天</span>
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
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <Button
            className="mt-4"
            disabled={!email.trim() || busy}
            onClick={() => {
              setBusy(true);
              setError("");
              void updateEmail(email)
                .then(() => setSaved(true))
                .catch((e: Error) => setError(e.message))
                .finally(() => setBusy(false));
            }}
          >
            {saved ? "已保存" : busy ? "保存中…" : "保存邮箱"}
          </Button>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-border bg-surface-muted p-4 text-xs leading-relaxed text-muted">
          任务加速券通过连续 3 天签到获得，只能在 AI
          提取任务开始时勾选使用，可将提取速率提升至四倍。
        </div>

        <Button
          variant="danger"
          className="w-full"
          icon={<SignOut size={18} />}
          onClick={() => {
            void logout().then(() => router.push("/"));
          }}
        >
          退出登录
        </Button>
      </div>
    </div>
  );
}
