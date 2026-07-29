import { createHash, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.authSecret + ":admin");

/** 登录失败计数：key = ip|account */
type AttemptRec = {
  fails: number;
  lockedUntil: number;
  windowStart: number;
  windowFails: number;
};

const attempts = (globalThis as unknown as {
  __adminLoginAttempts?: Map<string, AttemptRec>;
}).__adminLoginAttempts ?? new Map<string, AttemptRec>();

(
  globalThis as unknown as { __adminLoginAttempts?: Map<string, AttemptRec> }
).__adminLoginAttempts = attempts;

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const WINDOW_MS = 60 * 60 * 1000;
const WINDOW_MAX = 20;
const MIN_LOGIN_MS = 450;

function sha256(s: string) {
  return createHash("sha256").update(s, "utf8").digest();
}

/** 常量时间字符串比较，降低时序侧信道风险 */
export function safeEqualStr(a: string, b: string) {
  const ha = sha256(a);
  const hb = sha256(b);
  return timingSafeEqual(ha, hb);
}

export function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function attemptKey(ip: string, account: string) {
  return `${ip}|${account.toLowerCase()}`;
}

export function checkAdminLoginAllowed(ip: string, account: string): {
  ok: boolean;
  error?: string;
  retryAfterSec?: number;
} {
  const key = attemptKey(ip, account);
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec) return { ok: true };

  if (rec.lockedUntil > now) {
    const retryAfterSec = Math.ceil((rec.lockedUntil - now) / 1000);
    return {
      ok: false,
      error: `尝试次数过多，请 ${Math.ceil(retryAfterSec / 60)} 分钟后再试`,
      retryAfterSec,
    };
  }

  if (now - rec.windowStart > WINDOW_MS) {
    rec.windowStart = now;
    rec.windowFails = 0;
  }
  if (rec.windowFails >= WINDOW_MAX) {
    rec.lockedUntil = now + LOCK_MS;
    return {
      ok: false,
      error: "尝试过于频繁，账号已临时锁定 15 分钟",
      retryAfterSec: Math.ceil(LOCK_MS / 1000),
    };
  }

  return { ok: true };
}

export function recordAdminLoginFail(ip: string, account: string) {
  const key = attemptKey(ip, account);
  const now = Date.now();
  const rec = attempts.get(key) ?? {
    fails: 0,
    lockedUntil: 0,
    windowStart: now,
    windowFails: 0,
  };

  if (now - rec.windowStart > WINDOW_MS) {
    rec.windowStart = now;
    rec.windowFails = 0;
  }

  rec.fails += 1;
  rec.windowFails += 1;

  if (rec.fails >= MAX_FAILS) {
    rec.lockedUntil = now + LOCK_MS;
    rec.fails = 0;
  }

  attempts.set(key, rec);
}

export function recordAdminLoginSuccess(ip: string, account: string) {
  attempts.delete(attemptKey(ip, account));
}

export async function delayLoginMin() {
  await new Promise((r) => setTimeout(r, MIN_LOGIN_MS));
}

export function verifyAdminCredentials(account: string, password: string) {
  const accOk = safeEqualStr(account.trim(), env.adminAccount);
  const pwdOk = safeEqualStr(password, env.adminPassword);
  return accOk && pwdOk;
}

export async function createAdminToken() {
  return new SignJWT({ role: "admin", account: env.adminAccount })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime("3d")
    .sign(secret);
}

export async function setAdminCookie(token: string) {
  const jar = await cookies();
  jar.set(env.adminCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 3,
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(env.adminCookie);
}

export async function getAdminSession() {
  const jar = await cookies();
  const token = jar.get(env.adminCookie)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.sub !== "admin" || payload.role !== "admin") return null;
    return {
      account:
        typeof payload.account === "string"
          ? payload.account
          : env.adminAccount,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: "未登录管理后台" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}
