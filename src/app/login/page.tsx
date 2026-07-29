"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth-store";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-[var(--radius)] border border-border bg-surface p-6 shadow-[var(--shadow)] md:p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <BrandLogo size={36} className="h-9 w-9" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">登录</h1>
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
            placeholder="请输入账号"
            autoComplete="username"
          />
          <Input
            label="密码"
            name="password"
            type="password"
            required
            placeholder="请输入密码"
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" size="lg">
            登录
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          还没有账号？{" "}
          <Link
            href="/register"
            className="font-medium text-accent hover:underline"
          >
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
