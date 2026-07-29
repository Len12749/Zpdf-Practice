/** 单文件上限 20MB */
export const MAX_SINGLE_FILE_BYTES = 20 * 1024 * 1024;
/** 一次上传总大小上限 100MB */
export const MAX_TOTAL_FILES_BYTES = 100 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 校验上传文件大小。
 * @returns 错误文案；通过则返回 null
 */
export function validateUploadFileSizes(
  files: { name: string; size: number }[],
): string | null {
  if (!files.length) return "请上传 PDF 或图片";

  for (const f of files) {
    if (f.size > MAX_SINGLE_FILE_BYTES) {
      return `「${f.name}」超过单文件上限 ${formatFileSize(MAX_SINGLE_FILE_BYTES)}（当前 ${formatFileSize(f.size)}）`;
    }
  }

  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_TOTAL_FILES_BYTES) {
    return `文件总大小超过 ${formatFileSize(MAX_TOTAL_FILES_BYTES)}（当前 ${formatFileSize(total)}）`;
  }

  return null;
}
