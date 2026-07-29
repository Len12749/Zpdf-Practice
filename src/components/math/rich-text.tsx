"use client";

import { useMemo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/cn";

/**
 * 轻量预处理：只做换行归一 + 把「公式被单独拆行」收成行内。
 * 真正的 LaTeX 交给 remark-math + rehype-katex，不要手拆 $...$。
 */
function prepare(text: string) {
  let s = (text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  // 行内公式两侧的多余单换行 → 空格
  s = s.replace(/([^\n])\n+(\$[^$\n]+\$)/g, "$1 $2");
  s = s.replace(/(\$[^$\n]+\$)\n+([^\n$])/g, "$1 $2");
  s = s.replace(/(\$[^$\n]+\$)\n+(\$)/g, "$1 $2");
  s = s.replace(/\n(\$[^$\n]{1,48}\$)\n/g, " $1 ");
  return s;
}

const components = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="my-1.5 leading-relaxed last:mb-0 first:mt-0">{children}</p>
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
};

/**
 * 题干 / 选项 / 解析：Markdown + LaTeX 一次渲染。
 * $...$ 行内，$$...$$ 块级。
 */
export function RichText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const source = useMemo(() => prepare(children ?? ""), [children]);

  return (
    <div className={cn("rich-text latex-content break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              throwOnError: false,
              strict: "ignore",
              output: "htmlAndMathml",
            },
          ],
        ]}
        components={components as never}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

/** 兼容旧调用：仅做切段，供调试/测试 */
export function parseLatexSegments(input: string) {
  if (!input) return [{ type: "text" as const, value: "" }];
  return [{ type: "text" as const, value: input }];
}

export { RichText as LatexText };
