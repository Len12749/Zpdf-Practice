"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImportProgressPanel } from "@/components/import/import-progress";
import {
  ArrowLeft,
  DownloadSimple,
  FileCsv,
  UploadSimple,
} from "@phosphor-icons/react";

const TEMPLATE_CSV = `题干,选项,答案,解析
"设函数 f(x)=x^2，则 f'(x) 为？","A. 2x|B. x|C. 2|D. x^2",A,"求导法则：幂函数导数 nx^{n-1}"
"下列正确的是？（多选）","A. 1+1=2|B. 2+2=5|C. 3×3=9|D. 0×1=0","A;C;D","基础算术"
`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Zpdf_practice_题库导入模板.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportCsvPage() {
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href="/libraries"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} />
        返回题库
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">导入 CSV</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        字段要求：题干、选项、答案、解析。缺失题干或选项的行将丢弃；缺失答案或解析将由
        AI 补全并标注。
      </p>

      <div className="mt-8 space-y-5">
        <fieldset disabled={started} className="space-y-5 disabled:opacity-60">
          <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <FileCsv size={22} weight="duotone" />
                </div>
                <div>
                  <p className="text-sm font-semibold">下载导入模板</p>
                  <p className="mt-0.5 text-xs text-muted">
                    选项用 | 分隔，多选用分号分隔答案字母
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                icon={<DownloadSimple size={18} />}
                onClick={downloadTemplate}
                disabled={started}
              >
                下载模板
              </Button>
            </div>
          </div>

          <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
            <Input
              label="题库名称"
              required
              placeholder="例如：线性代数章节练习"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="rounded-[var(--radius)] border border-dashed border-border bg-surface p-8 text-center">
            <UploadSimple size={28} className="mx-auto text-muted" />
            <p className="mt-3 text-sm font-medium">选择 CSV 文件</p>
            <p className="mt-1 text-xs text-muted">.csv，UTF-8 编码推荐</p>
            <Button className="mt-4" variant="secondary" size="sm" disabled={started}>
              选择文件
            </Button>
          </div>
        </fieldset>

        <div className="rounded-[var(--radius-sm)] border border-border bg-surface-muted p-4 text-xs leading-relaxed text-muted">
          <p className="font-medium text-foreground">复审规则</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>题干或选项缺失：直接丢弃该行</li>
            <li>答案或解析缺失：AI 自动生成，前端标注「AI 生成」</li>
            <li>手动修改答案/解析后，AI 标识自动取消</li>
          </ul>
        </div>

        {!started ? (
          <Button
            className="w-full"
            size="lg"
            disabled={!name.trim()}
            onClick={() => setStarted(true)}
          >
            开始导入
          </Button>
        ) : (
          <div className="space-y-3">
            <ImportProgressPanel
              progress={{
                completed: 1,
                total: 2,
                pageCount: 0,
                phaseLabel: "正在复审 CSV 并补全缺失答案/解析…",
              }}
              variant="panel"
            />
            <p className="text-xs text-muted">
              导入完成前题库列表中会显示「正在导入」且不可点击打开。
            </p>
            <Link href="/libraries">
              <Button variant="secondary" size="sm" className="w-full">
                返回题库列表查看进度
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
