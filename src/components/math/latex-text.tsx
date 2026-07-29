"use client";

import katex from "katex";
import { useMemo } from "react";
import { cn } from "@/lib/cn";

type Segment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; display: boolean };

/**
 * 解析混合文本中的 LaTeX：
 * - 行内：$...$ 或 \(...\)
 * - 独立行：$$...$$ 或 \[...\]
 * 未闭合定界符按纯文本处理。
 */
export function parseLatexSegments(input: string): Segment[] {
  if (!input) return [{ type: "text", value: "" }];

  const segments: Segment[] = [];
  // $$...$$ | $...$ | \[...\] | \(...\)
  const re =
    /\$\$([\s\S]+?)\$\$|\$((?:\\.|[^$\\])+)\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;

  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) {
      segments.push({ type: "text", value: input.slice(last, m.index) });
    }
    if (m[1] != null) {
      segments.push({ type: "math", value: m[1].trim(), display: true });
    } else if (m[2] != null) {
      segments.push({ type: "math", value: m[2].trim(), display: false });
    } else if (m[3] != null) {
      segments.push({ type: "math", value: m[3].trim(), display: true });
    } else if (m[4] != null) {
      segments.push({ type: "math", value: m[4].trim(), display: false });
    }
    last = m.index + m[0].length;
  }
  if (last < input.length) {
    segments.push({ type: "text", value: input.slice(last) });
  }
  return segments.length ? segments : [{ type: "text", value: input }];
}

function renderMath(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: "ignore",
      output: "html",
      trust: false,
    });
  } catch {
    return tex;
  }
}

export function LatexText({
  children,
  className,
  as: Tag = "span",
}: {
  children: string;
  className?: string;
  as?: "span" | "p" | "div";
}) {
  const segments = useMemo(() => parseLatexSegments(children ?? ""), [children]);

  return (
    <Tag className={cn("latex-content break-words", className)}>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.value}</span>;
        }
        const html = renderMath(seg.value, seg.display);
        return (
          <span
            key={i}
            className={cn(
              "katex-host",
              seg.display && "my-2 block overflow-x-auto text-center",
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </Tag>
  );
}
