/**
 * 浏览器端将 PDF 转为逐页压缩 JPEG，便于预览、排序与上传。
 * 清晰度按「够 AI 读题」取舍，不做印刷级高清。
 */

export type PdfPageImage = {
  file: File;
  url: string;
  label: string;
};

/** 长边上限（px），再大对 OCR 收益有限、体积暴涨 */
const MAX_EDGE = 1280;
/** JPEG 质量 0–1 */
const JPEG_QUALITY = 0.72;

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("无法生成图片"));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/**
 * 把任意图片 File 再压一遍（尺寸 + JPEG），用于用户直接上传的图片。
 */
export async function compressImageFile(file: File): Promise<{
  file: File;
  url: string;
  label: string;
}> {
  // 已是很小的图可跳过解码
  if (file.size <= 180 * 1024 && !file.type.includes("png")) {
    return {
      file,
      url: URL.createObjectURL(file),
      label: file.name,
    };
  }

  const bitmap = await createImageBitmap(file);
  try {
    let { width, height } = bitmap;
    const long = Math.max(width, height);
    if (long > MAX_EDGE) {
      const scale = MAX_EDGE / long;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("浏览器不支持 Canvas");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvasToJpegBlob(canvas);
    canvas.width = 0;
    canvas.height = 0;

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    const out = new File([blob], `${base}.jpg`, { type: "image/jpeg" });
    return {
      file: out,
      url: URL.createObjectURL(blob),
      label: file.name,
    };
  } finally {
    bitmap.close();
  }
}

export async function convertPdfToImages(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<PdfPageImage[]> {
  const pdfjs = await import("pdfjs-dist");

  if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  const total = doc.numPages;
  if (total < 1) throw new Error("PDF 没有可用页面");

  const base = file.name.replace(/\.pdf$/i, "") || "pdf";
  const out: PdfPageImage[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await doc.getPage(i);
    // 先按 1.0 取尺寸，再按长边上限缩放
    const baseViewport = page.getViewport({ scale: 1 });
    const long = Math.max(baseViewport.width, baseViewport.height);
    // 不放大，只在超长边时缩小
    const scale = long > MAX_EDGE ? MAX_EDGE / long : 1;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("浏览器不支持 Canvas");

    // 白底，避免透明 JPEG 发黑
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const blob = await canvasToJpegBlob(canvas);
    const name = `${base}-p${String(i).padStart(3, "0")}.jpg`;
    const imageFile = new File([blob], name, { type: "image/jpeg" });
    out.push({
      file: imageFile,
      url: URL.createObjectURL(blob),
      label: `${base} · 第 ${i}/${total} 页`,
    });
    onProgress?.(i, total);

    canvas.width = 0;
    canvas.height = 0;
  }

  await doc.cleanup().catch(() => undefined);
  return out;
}
