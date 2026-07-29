"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/client-api";
import { useFeedback } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import {
  ArrowLeft,
  DownloadSimple,
  FileCsv,
  UploadSimple,
  X,
} from "@phosphor-icons/react";

const TEMPLATE_CSV = `题干,选项,答案,解析
"设函数 $f(x)=x^2$，则 $f'(x)$ 为？","A. $2x$|B. $x$|C. $2$|D. $x^2$",A,"幂函数求导"
"下列正确的是？（多选）","A. $1+1=2$|B. $2+2=5$|C. $3\\times3=9$|D. $0\\times1=0$","A;C;D","基础算术"
`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Zpdf-Practice_题库导入模板.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function isCsvFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel" ||
    file.type === "text/plain"
  );
}

export default function ImportCsvPage() {
  const { isLoggedIn, loading } = useAuth();
  const { toast } = useFeedback();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [dropActive, setDropActive] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) router.replace("/login");
  }, [loading, isLoggedIn, router]);

  const pickFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!isCsvFile(f)) {
      toast("请选择 CSV 文件", "error");
      return;
    }
    setFile(f);
  };

  const onDropFiles = (list: FileList | null) => {
    if (!list?.length) return;
    pickFile(list[0]);
  };

  const startImport = async () => {
    if (!file || !name.trim()) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("file", file);
      const data = await api<{ id: string }>("/api/libraries/import-csv", {
        method: "POST",
        body: fd,
      });
      toast("导入完成，进入复审", "success");
      router.push(`/libraries/${data.id}/review`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "导入失败", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-muted">
        加载中…
      </div>
    );
  }

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
        字段：题干、选项、答案、解析。缺失题干/选项的行丢弃；缺失答案/解析由 AI
        补全并标注。
      </p>

      <div className="mt-8 space-y-5">
        <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <FileCsv size={22} weight="regular" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">下载导入模板</p>
                <p className="mt-0.5 text-xs text-muted">
                  选项用 | 分隔，多选答案用分号
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              icon={<DownloadSimple size={18} />}
              onClick={downloadTemplate}
              type="button"
            >
              下载模板
            </Button>
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
          <Input
            label="题库名称"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：线性代数章节练习"
            disabled={busy}
          />
        </div>

        {/* 拖拽 / 点击选择区 */}
        <div
          className={cn(
            "rounded-[var(--radius)] border-2 border-dashed bg-surface p-8 text-center transition-colors",
            dropActive
              ? "border-accent bg-accent-soft/50"
              : "border-border hover:border-accent/40",
            busy && "pointer-events-none opacity-60",
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDropActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDropActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDropActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDropActive(false);
            onDropFiles(e.dataTransfer.files);
          }}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <UploadSimple size={24} weight="regular" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            {file ? "已选择文件" : "拖拽 CSV 到此处，或点击选择"}
          </p>
          <p className="mt-1 text-xs text-muted">仅支持 .csv 文件</p>

          {file ? (
            <div className="mx-auto mt-4 flex max-w-md items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-left">
              <FileCsv size={20} className="shrink-0 text-accent" weight="regular" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:text-danger"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                aria-label="移除文件"
                disabled={busy}
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            tabIndex={-1}
            disabled={busy}
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              // 允许重复选同一文件
              e.target.value = "";
            }}
          />

          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {file ? "重新选择" : "选择 CSV 文件"}
            </Button>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!name.trim() || !file || busy}
          onClick={() => void startImport()}
        >
          {busy ? "导入中…" : "开始导入"}
        </Button>
      </div>
    </div>
  );
}
