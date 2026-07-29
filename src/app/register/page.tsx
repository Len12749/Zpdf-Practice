"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth-store";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow)] md:p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <BrandLogo size={36} className="h-9 w-9" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">注册</h1>
            <p className="text-xs text-muted">Zpdf_practice</p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            login();
            router.push("/libraries");
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
            placeholder="设置密码"
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
          <Button type="submit" className="w-full" size="lg">
            创建账号
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
