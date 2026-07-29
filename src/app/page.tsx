"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  FilePdf,
  Images,
  ListChecks,
  Sparkle,
  ArrowRight,
  UploadSimple,
} from "@phosphor-icons/react";

const ease = [0.22, 1, 0.36, 1] as const;

export default function HomePage() {
  const reduce = useReducedMotion();

  const fadeUp = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease },
        };

  const inView = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-48px" },
          transition: { duration: 0.5, delay, ease },
        };

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-[1400px] gap-10 px-4 pb-16 pt-10 md:grid-cols-12 md:gap-8 md:px-6 md:pb-20 md:pt-16">
        <div className="flex flex-col justify-center md:col-span-6 lg:col-span-5">
          <motion.h1
            className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
            {...fadeUp(0.05)}
          >
            把试卷变成
            <br />
            可刷的题库
          </motion.h1>
          <motion.p
            className="mt-4 max-w-md text-base leading-relaxed text-muted"
            {...fadeUp(0.14)}
          >
            上传 PDF 或图片，AI 自动整理选择题，复审编辑后一键刷题背题。
          </motion.p>
          <motion.div
            className="mt-7 flex flex-wrap items-center gap-3"
            {...fadeUp(0.22)}
          >
            <Link href="/libraries/new">
              <Button size="lg" icon={<UploadSimple size={18} weight="bold" />}>
                创建题库
              </Button>
            </Link>
            <Link href="/libraries">
              <Button size="lg" variant="outline" icon={<ArrowRight size={18} />}>
                管理题库
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="md:col-span-6 lg:col-span-7"
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, y: 24, scale: 0.98 },
                animate: { opacity: 1, y: 0, scale: 1 },
                transition: { duration: 0.7, delay: 0.12, ease },
              })}
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero.webp"
              alt="试卷智能提取与刷题概念图"
              className="aspect-[3/2] w-full object-cover"
            />
          </div>
        </motion.div>
      </section>

      {/* Trust strip */}
      <motion.section
        className="border-y border-border bg-surface"
        {...inView(0)}
      >
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-6">
          <p className="text-sm text-muted">合作与产品沉淀</p>
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-foreground/80">
            <span>北京理工大学孵化器</span>
            <span className="text-border">|</span>
            <a
              href="https://zhiyipdf.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent"
            >
              Zpdf
            </a>
          </div>
        </div>
      </motion.section>

      {/* Feature bento */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-6 md:py-20">
        <motion.div {...inView(0)}>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            从扫描件到刷题流
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
            从上传试卷到刷题巩固，少折腾，直接用。
          </p>
        </motion.div>

        <div className="mt-8 grid gap-3 md:grid-cols-6 md:grid-rows-2">
          <motion.div
            className="rounded-2xl border border-border bg-surface p-6 md:col-span-3 md:row-span-2"
            {...inView(0.05)}
          >
            <FilePdf size={28} className="text-accent" />
            <h3 className="mt-4 text-lg font-semibold">PDF / 图片导入</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              PDF 自动转图，支持多图拖拽排序与大图预览。任务开始时可选用加速券，提取速率提升至四倍。
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/feature-import.webp"
              alt="PDF 与多页图片导入概念图"
              className="mt-6 aspect-[5/3] w-full rounded-xl object-cover"
            />
          </motion.div>

          <motion.div
            className="rounded-2xl border border-border bg-accent p-6 text-white dark:text-zinc-950 md:col-span-3"
            {...inView(0.12)}
          >
            <Sparkle size={28} />
            <h3 className="mt-4 text-lg font-semibold">跨页题目也能完整收录</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-90">
              题干被翻到下一页也不用担心，系统会尽量帮你收成完整一题，少丢题、少补录。
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-border bg-surface-muted p-6 md:col-span-2"
            {...inView(0.18)}
          >
            <ListChecks size={26} className="text-accent" />
            <h3 className="mt-3 font-semibold">刷题与背题</h3>
            <p className="mt-1.5 text-sm text-muted">
              顺序、逆序、乱序；错题自动入库。
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-border bg-surface p-6 md:col-span-1"
            {...inView(0.24)}
          >
            <Images size={26} className="text-accent" />
            <h3 className="mt-3 font-semibold">CSV</h3>
            <p className="mt-1.5 text-sm text-muted">模板导入</p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface">
        <div className="mx-auto max-w-[1400px] px-4 py-16 md:px-6 md:py-20">
          <motion.h2
            className="text-2xl font-semibold tracking-tight md:text-3xl"
            {...inView(0)}
          >
            三步开始
          </motion.h2>
          <ol className="mt-8 grid gap-0 border-t border-border md:grid-cols-3">
            {[
              {
                title: "上传试卷",
                body: "PDF 或一组图片，调整页序后确认。",
              },
              {
                title: "AI 提取复审",
                body: "自动整理题目，你可增删改；AI 补全处会标明。",
              },
              {
                title: "刷题巩固",
                body: "刷题、背题、错题本、收藏夹联动。",
              },
            ].map((step, i) => (
              <motion.li
                key={step.title}
                className="border-b border-border py-6 md:border-b-0 md:border-r md:px-6 md:py-8 last:md:border-r-0 first:md:pl-0 last:md:pr-0"
                {...inView(0.08 * i)}
              >
                <span className="font-mono text-sm text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-6 md:py-20">
        <motion.div
          className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-surface-muted p-8 md:flex-row md:items-center md:p-10"
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, y: 20, scale: 0.99 },
                whileInView: { opacity: 1, y: 0, scale: 1 },
                viewport: { once: true, margin: "-48px" },
                transition: { duration: 0.55, ease },
              })}
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              账号最多 10 个题库
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted">
              连续 3 天签到可获 1 张任务加速券。登录后即可创建题库并开始刷题。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register">
              <Button size="lg">免费注册</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                立即登录
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
