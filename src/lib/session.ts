import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.authSecret);

export type SessionPayload = {
  sub: string;
  account: string;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ account: payload.account })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  if (!payload.sub || typeof payload.account !== "string") return null;
  return {
    sub: payload.sub,
    account: payload.account,
  } satisfies SessionPayload;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(env.sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(env.sessionCookie);
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(env.sessionCookie)?.value;
  if (!token) return null;
  try {
    const session = await verifySessionToken(token);
    if (!session) return null;
    const [user] = await db
      .select({
        id: users.id,
        account: users.account,
        email: users.email,
        speedTickets: users.speedTickets,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.sub))
      .limit(1);
    return user ?? null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "未登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
