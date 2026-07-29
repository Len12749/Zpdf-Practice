import fs from "fs/promises";
import path from "path";
import { env } from "@/lib/env";
import { LATEX_PROMPT_BLOCK } from "@/lib/ai-latex-rules";
import { inferQuestionType } from "@/lib/question-type";

/** 内部统一零件；实际走 OpenAI 兼容 chat/completions（该 key 不支持 Gemini native） */
type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export type ExtractedBlock = {
  stem: string;
  options: { key: string; text: string }[];
  answer: string[];
  explanation: string;
  /** 答案是否原文印在卷面上（非模型推断） */
  answerOnPaper: boolean;
  /** 解析是否原文印在卷面上 */
  explanationOnPaper: boolean;
  truncated?: boolean;
  pageIndex: number;
  position: "full" | "start" | "end" | "middle";
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 带优先级的限流池：
 * - high：页提取（优先）
 * - low：跨页判断 / 答案解析补全
 * 并发上限内尽量占满；有高优先时先跑高优先，空槽再填低优先。
 */
export class PriorityRatePool {
  private high: Array<() => void> = [];
  private low: Array<() => void> = [];
  private active = 0;
  private lastStart = 0;
  private pumping = false;

  constructor(
    private concurrency: number,
    private minIntervalMs: number,
  ) {}

  /** 高优先（提取） */
  runHigh<T>(fn: () => Promise<T>): Promise<T> {
    return this.enqueue(true, fn);
  }

  /** 低优先（跨页 / 补全） */
  runLow<T>(fn: () => Promise<T>): Promise<T> {
    return this.enqueue(false, fn);
  }

  /** 兼容旧调用：默认高优先 */
  run<T>(fn: () => Promise<T>): Promise<T> {
    return this.runHigh(fn);
  }

  private enqueue<T>(high: boolean, fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const starter = () => {
        this.active += 1;
        this.lastStart = Date.now();
        fn()
          .then(resolve, reject)
          .finally(() => {
            this.active -= 1;
            void this.pump();
          });
      };
      if (high) this.high.push(starter);
      else this.low.push(starter);
      void this.pump();
    });
  }

  private async pump() {
    if (this.pumping) return;
    this.pumping = true;
    try {
      while (
        this.active < this.concurrency &&
        (this.high.length > 0 || this.low.length > 0)
      ) {
        const wait = Math.max(
          0,
          this.minIntervalMs - (Date.now() - this.lastStart),
        );
        if (wait > 0) await sleep(wait);
        if (this.active >= this.concurrency) break;
        // 优先提取
        const starter = this.high.shift() ?? this.low.shift();
        if (!starter) break;
        starter();
      }
    } finally {
      this.pumping = false;
      if (
        this.active < this.concurrency &&
        (this.high.length > 0 || this.low.length > 0)
      ) {
        void this.pump();
      }
    }
  }
}

export type RatePool = PriorityRatePool;

export function createGeminiPool(accelerated: boolean) {
  return new PriorityRatePool(accelerated ? 20 : 5, 1000);
}

async function fileToInlinePart(filePath: string): Promise<GeminiPart> {
  const buf = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";
  return {
    inline_data: {
      mime_type: mime,
      data: buf.toString("base64"),
    },
  };
}

/**
 * openjk 该 API Key 平台不是 gemini native。
 * 实测可用：POST /v1/chat/completions + model=gemini-2.5-flash + 多模态 content。
 */
export async function geminiGenerate(parts: GeminiPart[], temperature = 0.2) {
  if (!env.geminiApiKey) {
    throw new Error("未配置 GEMINI_API_KEY");
  }

  type ContentPart =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };

  const content: ContentPart[] = parts.map((p) => {
    if ("text" in p) return { type: "text", text: p.text };
    return {
      type: "image_url",
      image_url: {
        url: `data:${p.inline_data.mime_type};base64,${p.inline_data.data}`,
      },
    };
  });

  const url = `${env.geminiBaseUrl}/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.geminiApiKey}`,
    },
    body: JSON.stringify({
      model: env.geminiModel,
      temperature,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请只输出合法 JSON，不要 Markdown 代码块包裹。",
            },
            ...content,
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`模型调用错误 ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

function parseJsonLoose(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const m = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]);
    throw new Error("模型返回非 JSON");
  }
}

const EXTRACT_SCHEMA_HINT = `
你是试卷 OCR/结构化提取器，只能抄录卷面可见内容，禁止编造。

输出 JSON：
{
  "blocks": [
    {
      "stem": "题干文本（不要含题号）",
      "options": [{"key":"A","text":"选项原文"},{"key":"B","text":"..."}],
      "answer": ["A"],
      "explanation": "",
      "answerOnPaper": false,
      "explanationOnPaper": false,
      "truncated": false,
      "position": "full|start|end|middle"
    }
  ]
}

硬性规则：
1. **禁止私自补充题干或选项**：看不清、被裁切、缺失的字不要猜补；宁可 truncated=true，也不要脑补完整句子。
2. **题干不要输出序号**：不要写「1.」「2、」「（3）」「第4题」等题号，只保留题目正文。
3. 选项字母统一为 A/B/C/D/E...（忽略①Ⅰ等符号，映射到 ABC）。
4. **答案/解析仅当卷面明确印出时才填写**：
   - 卷面有明确答案（如「答案：C」或答题卡标注）→ answer 填字母，answerOnPaper=true
   - 否则 answer 必须 []，answerOnPaper=false（禁止根据题意猜答案）
   - 卷面有解析文字 → explanation 抄录，explanationOnPaper=true
   - 否则 explanation 必须 ""，explanationOnPaper=false（禁止写解析）
5. 题干或选项严重缺失的块不要输出。
6. 跨页截断：truncated=true，position 用 start/middle/end，仍只抄可见部分。
7. **换行**：保持原文换行，JSON 字符串内用 \\n，禁止压成一行。
${LATEX_PROMPT_BLOCK}
`.trim();

/** 去掉题干前导题号 */
export function stripStemNumber(stem: string) {
  let s = edgeTrim(stem);
  // 反复剥离前导编号
  for (let i = 0; i < 3; i++) {
    const next = s
      .replace(/^(?:第\s*)?\d+\s*[题\.、．\)\]）]\s*/u, "")
      .replace(/^[（(]\s*\d+\s*[）)]\s*/u, "")
      .replace(/^\d+\s*[\.、．]\s*/u, "")
      .replace(/^[一二三四五六七八九十百千]+\s*[、．.]\s*/u, "")
      .replace(/^［\s*\d+\s*］\s*/u, "")
      .replace(/^\[\s*\d+\s*\]\s*/u, "");
    if (next === s) break;
    s = edgeTrim(next);
  }
  return s;
}

function parseOnPaperFlag(raw: unknown, hasContent: boolean): boolean {
  if (typeof raw === "boolean") return raw && hasContent;
  if (raw === 1 || raw === "1" || raw === "true") return hasContent;
  // 模型未给标记时：有内容也不轻信，默认视为非卷面（防私补）
  // 仅当明确 true 才算卷面
  return false;
}

/** 单页提取（不含调度；由 PriorityRatePool 包裹） */
export async function extractBlocksFromPage(
  imagePath: string,
  pageIndex: number,
): Promise<ExtractedBlock[]> {
  const image = await fileToInlinePart(imagePath);
  const text = await geminiGenerate([
    { text: `这是试卷第 ${pageIndex + 1} 页。\n${EXTRACT_SCHEMA_HINT}` },
    image,
  ]);
  const data = parseJsonLoose(text) as {
    blocks?: Array<Record<string, unknown>>;
  };
  const blocks = Array.isArray(data.blocks) ? data.blocks : [];
  return blocks
    .map((b) => {
      const stem = stripStemNumber(String(b.stem ?? ""));
      const options = Array.isArray(b.options)
        ? (b.options as Array<{ key?: string; text?: string }>)
            .map((o) => ({
              key: String(o.key ?? "")
                .toUpperCase()
                .replace(/[^A-Z]/g, "")
                .slice(0, 1),
              text: edgeTrim(String(o.text ?? "")),
            }))
            .filter((o) => o.key && o.text)
        : [];

      let answer = normalizeAnswerField(b.answer);
      let explanation = edgeTrim(String(b.explanation ?? ""));

      const answerOnPaper = parseOnPaperFlag(
        b.answerOnPaper ?? b.answer_on_paper,
        answer.length > 0,
      );
      const explanationOnPaper = parseOnPaperFlag(
        b.explanationOnPaper ?? b.explanation_on_paper,
        !isBlankExplanation(explanation),
      );

      if (!answerOnPaper) answer = [];
      if (!explanationOnPaper) explanation = "";

      return {
        stem,
        options,
        answer,
        explanation,
        answerOnPaper,
        explanationOnPaper,
        truncated: Boolean(b.truncated),
        pageIndex,
        position: (["full", "start", "end", "middle"].includes(
          String(b.position),
        )
          ? b.position
          : "full") as ExtractedBlock["position"],
      };
    })
    .filter((b) => b.stem && b.options.length >= 2);
}

/** 跨页判断（不含调度） */
export async function shouldMergeBlocks(
  prev: ExtractedBlock,
  next: ExtractedBlock,
): Promise<boolean> {
  const text = await geminiGenerate([
    {
      text: `判断两段内容是否属于同一道被跨页截断的选择题。只输出 JSON：{"merge":true|false,"reason":"..."}\n\n【上一页末块】\n题干: ${prev.stem}\n选项: ${JSON.stringify(prev.options)}\n答案: ${prev.answer.join(",")}\n解析: ${prev.explanation}\ntruncated=${prev.truncated} position=${prev.position}\n\n【下一页首块】\n题干: ${next.stem}\n选项: ${JSON.stringify(next.options)}\n答案: ${next.answer.join(",")}\n解析: ${next.explanation}\ntruncated=${next.truncated} position=${next.position}`,
    },
  ]);
  const data = parseJsonLoose(text) as { merge?: boolean };
  return Boolean(data.merge);
}

/** 仅去掉首尾空白，保留内部换行 */
export function edgeTrim(s: string) {
  return s.replace(/^\s+|\s+$/g, "");
}

function isBlankExplanation(s: string) {
  const t = edgeTrim(s);
  if (!t) return true;
  return /^(无|无解析|暂无|暂无解析|略|见答案|none|n\/a|null|-|—|–)$/i.test(t);
}

function normalizeAnswerField(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((a) =>
        String(a)
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
          .slice(0, 1),
      )
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .toUpperCase()
      .split(/[^A-Z]+/)
      .map((s) => s.slice(0, 1))
      .filter(Boolean);
  }
  return [];
}

/**
 * 仅允许补全「答案 / 解析」。
 * 禁止修改题干与选项（调用方不得把补全结果写回 stem/options）。
 */
export async function completeAnswerExplanation(
  stem: string,
  options: { key: string; text: string }[],
  answer: string[],
  explanation: string,
  meta?: { answerOnPaper?: boolean; explanationOnPaper?: boolean },
): Promise<{
  answer: string[];
  explanation: string;
  aiGeneratedAnswer: boolean;
  aiGeneratedExplanation: boolean;
  type: "single" | "multiple";
}> {
  // 卷面已有则绝不 AI 改写；卷面没有则必须 AI 补并打标
  const onPaperAns =
    Boolean(meta?.answerOnPaper) && normalizeAnswerField(answer).length > 0;
  const onPaperExpl =
    Boolean(meta?.explanationOnPaper) && !isBlankExplanation(explanation);

  const srcAnswer = onPaperAns ? normalizeAnswerField(answer) : [];
  const srcExpl = onPaperExpl ? edgeTrim(explanation) : "";
  const needAnswer = !onPaperAns;
  const needExpl = !onPaperExpl;

  if (!needAnswer && !needExpl) {
    return {
      answer: srcAnswer,
      explanation: srcExpl,
      aiGeneratedAnswer: false,
      aiGeneratedExplanation: false,
      type: inferQuestionType(srcAnswer),
    };
  }

  const text = await geminiGenerate([
    {
      text: `你只能补全「答案」和/或「解析」，严禁改写、补充题干或选项文字。
输出 JSON：{"answer":["A"],"explanation":"..."}
- 若只有一个正确选项，answer 只含一个字母；若有多个正确选项，answer 含多个字母。
- 系统会根据 answer 个数自动判定单选/多选，你不要输出 type 字段。
解析中保留换行（\\n）。不要输出题号。
${LATEX_PROMPT_BLOCK}

【题干，只读】
${stem}

【选项，只读】
${JSON.stringify(options)}

已有答案（卷面）: ${onPaperAns ? srcAnswer.join(",") : "(无，必须由你生成答案)"}
已有解析（卷面）: ${onPaperExpl ? srcExpl : "(无，必须由你生成解析)"}
需要你生成: ${needAnswer ? "答案" : ""}${needAnswer && needExpl ? " + " : ""}${needExpl ? "解析" : ""}
`,
    },
  ]);
  const data = parseJsonLoose(text) as {
    answer?: unknown;
    explanation?: string;
  };
  const nextAnswer = needAnswer
    ? normalizeAnswerField(data.answer)
    : srcAnswer;
  const nextExpl = needExpl
    ? edgeTrim(String(data.explanation ?? ""))
    : srcExpl;
  return {
    answer: nextAnswer,
    explanation: nextExpl || (needExpl ? "（暂无解析）" : srcExpl),
    aiGeneratedAnswer: needAnswer,
    aiGeneratedExplanation: needExpl,
    type: inferQuestionType(nextAnswer),
  };
}

export function mergeBlockContent(a: ExtractedBlock, b: ExtractedBlock): ExtractedBlock {
  const optMap = new Map<string, string>();
  // 合并时只拼接可见文本，不发明新选项文案
  for (const o of [...a.options, ...b.options]) {
    if (!optMap.has(o.key)) {
      optMap.set(o.key, o.text);
    } else {
      // 若另一页有更长的可见片段，取更长者（仍是抄录，不是编造）
      const prev = optMap.get(o.key)!;
      if (o.text.length > prev.length) optMap.set(o.key, o.text);
    }
  }
  const options = [...optMap.entries()]
    .sort(([x], [y]) => x.localeCompare(y))
    .map(([key, text]) => ({ key, text }));

  const answerOnPaper = a.answerOnPaper || b.answerOnPaper;
  const explanationOnPaper = a.explanationOnPaper || b.explanationOnPaper;
  const answer = a.answerOnPaper
    ? a.answer
    : b.answerOnPaper
      ? b.answer
      : [];
  const explanation = a.explanationOnPaper
    ? a.explanation
    : b.explanationOnPaper
      ? b.explanation
      : "";

  return {
    stem: stripStemNumber(
      [a.stem, b.stem].filter(Boolean).join("\n"),
    ),
    options,
    answer,
    explanation,
    answerOnPaper,
    explanationOnPaper,
    truncated: false,
    pageIndex: a.pageIndex,
    position: "full",
  };
}

export { sleep };
