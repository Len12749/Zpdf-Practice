import { count, eq } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import { db } from "@/db";
import { libraries, libraryPages, users } from "@/db/schema";
import { jsonError, jsonOk } from "@/lib/api";
import { env } from "@/lib/env";
import { runExtractJob } from "@/lib/extract-job";
import { pdfToImages } from "@/lib/pdf";
import { getSessionUser } from "@/lib/session";
import {
  cleanupLibraryFiles,
  ensureDir,
  libraryWorkDir,
  writeUploadFile,
} from "@/lib/storage";
import { validateUploadFileSizes } from "@/lib/upload-limits";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("未登录", 401);

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const useTicket = String(form.get("useTicket") ?? "") === "1";
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (!name) return jsonError("请填写题库名称");
  if (!files.length) return jsonError("请上传 PDF 或图片");

  const sizeError = validateUploadFileSizes(files);
  if (sizeError) return jsonError(sizeError, 400);

  const [{ c }] = await db
    .select({ c: count() })
    .from(libraries)
    .where(eq(libraries.userId, user.id));
  if (Number(c) >= env.libraryLimit) {
    return jsonError(`最多创建 ${env.libraryLimit} 个题库`);
  }

  let accelerated = false;
  if (useTicket) {
    if (user.speedTickets <= 0) return jsonError("加速券不足");
    await db
      .update(users)
      .set({ speedTickets: user.speedTickets - 1 })
      .where(eq(users.id, user.id));
    accelerated = true;
  }

  const libraryId = crypto.randomUUID();
  await db.insert(libraries).values({
    id: libraryId,
    userId: user.id,
    name,
    source: "upload",
    status: "importing",
    importAccelerated: accelerated,
    importPhaseLabel: "处理上传文件…",
  });

  try {
    const work = libraryWorkDir(libraryId);
    await ensureDir(work);
    const pagePaths: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buf = Buffer.from(await file.arrayBuffer());
      const lower = file.name.toLowerCase();
      const saved = await writeUploadFile(
        libraryId,
        `${String(i).padStart(2, "0")}-${file.name}`,
        buf,
      );

      if (lower.endsWith(".pdf")) {
        const pdfPages = await pdfToImages(
          saved,
          path.join(work, `pdf-${i}`),
        );
        pagePaths.push(...pdfPages);
      } else if (/\.(png|jpe?g|webp|gif)$/i.test(lower)) {
        pagePaths.push(saved);
      } else {
        throw new Error(`不支持的文件类型: ${file.name}`);
      }
    }

    if (!pagePaths.length) throw new Error("没有可用的页面图片");

    const total = pagePaths.length + Math.max(0, pagePaths.length - 1);
    await db.delete(libraryPages).where(eq(libraryPages.libraryId, libraryId));
    await db.insert(libraryPages).values(
      pagePaths.map((p, idx) => ({
        libraryId,
        sortOrder: idx,
        filePath: p,
      })),
    );
    await db
      .update(libraries)
      .set({
        importPageCount: pagePaths.length,
        importTotal: total,
        importCompleted: 0,
        importPhaseLabel: "准备 AI 提取…",
      })
      .where(eq(libraries.id, libraryId));

    // 后台跑任务（不 await）
    void runExtractJob(libraryId, pagePaths, accelerated);

    return jsonOk({ id: libraryId, pageCount: pagePaths.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db
      .update(libraries)
      .set({ status: "failed", importError: msg, importPhaseLabel: "失败" })
      .where(eq(libraries.id, libraryId));
    if (accelerated) {
      // 退还加速券
      const [u] = await db
        .select({ speedTickets: users.speedTickets })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      await db
        .update(users)
        .set({ speedTickets: (u?.speedTickets ?? 0) + 1 })
        .where(eq(users.id, user.id));
    }
    await cleanupLibraryFiles(libraryId);
    return jsonError(msg, 500);
  }
}
