"use client";

import katex from "katex";
import { useMemo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/cn";

type Segment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; display: boolean };

export function parseLatexSegments(input: string): Segment[] {
  if (!input) return [{ type: "text", value: "" }];

  const segments: Segment[] = [];
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

/** 规范化换行，确保 Markdown 能保留单行换行 */
function normalizeNewlines(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

const mdComponents = {
  table: ({ children }: { children?: ReactNode }) => (
    <div className="my-3 w-full overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[280px] border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => (
    <thead className="bg-surface-muted text-left">{children}</thead>
  ),
  tbody: ({ children }: { children?: ReactNode }) => (
    <tbody className="divide-y divide-border">{children}</tbody>
  ),
  tr: ({ children }: { children?: ReactNode }) => (
    <tr className="border-b border-border last:border-b-0">{children}</tr>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="px-3 py-2 font-semibold text-foreground">{children}</th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="px-3 py-2 align-top text-foreground/90">{children}</td>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="my-1.5 whitespace-pre-wrap leading-relaxed last:mb-0 first:mt-0">
      {children}
    </p>
  ),
  br: () => <br />,
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[0.9em]">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="my-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-surface-muted p-3 text-xs">
      {children}
    </pre>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      className="text-accent underline-offset-2 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

/**
 * 题干 / 选项 / 解析：Markdown（表格 + 换行）+ LaTeX 混排
 */
export function RichText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const segments = useMemo(
    () => parseLatexSegments(normalizeNewlines(children ?? "")),
    [children],
  );

  return (
    <div
      className={cn(
        "rich-text latex-content break-words whitespace-pre-wrap",
        className,
      )}
    >
      {segments.map((seg, i) => {
        if (seg.type === "math") {
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
        }
        if (!seg.value) return null;
        return (
          <ReactMarkdown
            key={i}
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={mdComponents as never}
          >
            {seg.value}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}

export { RichText as LatexText };
