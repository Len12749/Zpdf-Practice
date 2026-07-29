import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="text-sm font-semibold">Zpdf-Practice</p>
          <p className="mt-1 text-xs text-muted">
            北京智通明识科技有限公司 · 试卷智能提取与刷题平台
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <Link href="/about" className="hover:text-foreground">
            关于我们
          </Link>
          <Link href="/libraries" className="hover:text-foreground">
            题库管理
          </Link>
          <a
            href="https://zhiyipdf.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            Zpdf 官网
          </a>
        </div>
      </div>
    </footer>
  );
}
