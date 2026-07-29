import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { resolveTempPath } from "@/lib/storage";
import { getSessionUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const url = new URL(req.url);
  const p = url.searchParams.get("p");
  if (!p) {
    return NextResponse.json({ error: "缺少路径" }, { status: 400 });
  }
  try {
    const full = resolveTempPath(p);
    const data = await fs.readFile(full);
    const ext = path.extname(full).toLowerCase();
    const type =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : "image/jpeg";
    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
}
