import fs from "fs/promises";
import path from "path";

/**
 * 将 PDF 转为逐页 PNG。
 */
export async function pdfToImages(
  pdfPath: string,
  outDir: string,
): Promise<string[]> {
  await fs.mkdir(outDir, { recursive: true });

  const { createCanvas } = await import("@napi-rs/canvas");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const data = new Uint8Array(await fs.readFile(pdfPath));
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    // @ts-expect-error pdfjs node
    disableWorker: true,
  });
  const doc = await loadingTask.promise;
  const paths: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(
      Math.floor(viewport.width),
      Math.floor(viewport.height),
    );
    const ctx = canvas.getContext("2d");
    await page.render({
      // @ts-expect-error node canvas context
      canvasContext: ctx,
      viewport,
    }).promise;
    const out = path.join(outDir, `page-${String(i).padStart(3, "0")}.png`);
    await fs.writeFile(out, canvas.toBuffer("image/png"));
    paths.push(out);
  }

  return paths;
}
