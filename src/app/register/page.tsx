"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth-store";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow)] md:p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <BrandLogo size={36} className="h-9 w-9" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">注册</h1>
            <p className="text-xs text-muted">Zpdf-Practice</p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const password = String(fd.get("password"));
            const password2 = String(fd.get("password2"));
            if (password !== password2) {
              setError("两次输入的密码不一致");
              return;
            }
            if (password.length < 6) {
              setError("密码至少 6 位");
              return;
            }
            setBusy(true);
            setError("");
            void register(
              String(fd.get("account")),
              password,
              String(fd.get("email")),
            )
              .then(() => router.push("/libraries"))
              .catch((err: Error) => setError(err.message))
              .finally(() => setBusy(false));
          }}
        >
          <Input
            label="账号"
            name="account"
            required
            placeholder="设置登录账号"
            autoComplete="username"
          />
          <Input
            label="密码"
            name="password"
            type="password"
            required
            placeholder="至少 6 位"
            autoComplete="new-password"
          />
          <Input
            label="确认密码"
            name="password2"
            type="password"
            required
            placeholder="再输入一次密码"
            autoComplete="new-password"
          />
          <Input
            label="联系邮箱"
            name="email"
            type="email"
            required
            placeholder="用于我们与您联系"
            hint="必填，无需验证"
            autoComplete="email"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "创建中…" : "创建账号"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          已有账号？{" "}
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
