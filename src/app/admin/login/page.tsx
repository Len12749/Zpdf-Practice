"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand/logo";
import { api } from "@/lib/client-api";
import { useFeedback } from "@/components/ui/feedback";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    void api<{ account: string }>("/api/admin/me")
      .then(() => router.replace("/admin"))
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-muted">
        加载中…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow)] md:p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <BrandLogo size={36} className="h-9 w-9" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">管理后台</h1>
            <p className="text-xs text-muted">仅限管理员登录</p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setBusy(true);
            void api("/api/admin/login", {
              method: "POST",
              body: JSON.stringify({
                account: String(fd.get("account") ?? ""),
                password: String(fd.get("password") ?? ""),
              }),
            })
              .then(() => {
                toast("登录成功", "success");
                router.replace("/admin");
              })
              .catch((err: Error) => toast(err.message || "登录失败", "error"))
              .finally(() => setBusy(false));
          }}
        >
          <Input
            name="account"
            label="管理员账号"
            autoComplete="username"
            required
            placeholder="账号"
          />
          <Input
            name="password"
            type="password"
            label="密码"
            autoComplete="current-password"
            required
            placeholder="密码"
          />
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "验证中…" : "登录"}
          </Button>
        </form>
      </div>
    </div>
  );
}
