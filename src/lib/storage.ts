import fs from "fs/promises";
import path from "path";

/**
 * 临时文件根目录：固定相对段 `.tmp`，避免 dynamic path 触发 NFT 全量追踪。
 * process.cwd() 标记 turbopackIgnore，不把整个项目打进 serverless trace。
 */
function tmpRoot() {
  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    ".tmp",
  );
}

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export function libraryWorkDir(libraryId: string) {
  // 只允许 uuid 风格 id，防止路径穿越
  const safeId = libraryId.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(tmpRoot(), "libraries", safeId);
}

export async function writeUploadFile(
  libraryId: string,
  filename: string,
  data: Buffer,
) {
  const dir = libraryWorkDir(libraryId);
  await ensureDir(dir);
  const safe = filename.replace(/[^\w.\-()\u4e00-\u9fff]+/g, "_");
  const full = path.join(dir, safe);
  await fs.writeFile(full, data);
  return full;
}

export async function cleanupLibraryFiles(libraryId: string) {
  const dir = libraryWorkDir(libraryId);
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

export async function cleanupStaleTemp(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  try {
    const root = tmpRoot();
    await ensureDir(root);
    const entries = await fs.readdir(root, { withFileTypes: true });
    const now = Date.now();
    for (const ent of entries) {
      const full = path.join(root, ent.name);
      const st = await fs.stat(full);
      if (now - st.mtimeMs > maxAgeMs) {
        await fs.rm(full, { recursive: true, force: true });
      }
    }
  } catch {
    /* ignore */
  }
}

export function resolveTempPath(rel: string) {
  const root = tmpRoot();
  // 禁止 .. 穿越
  const normalized = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(root, normalized);
  if (!full.startsWith(root)) {
    throw new Error("非法路径");
  }
  return full;
}

export function toPublicUrl(filePath: string) {
  const root = tmpRoot();
  const rel = path.relative(root, filePath).replace(/\\/g, "/");
  return `/api/files?p=${encodeURIComponent(rel)}`;
}
