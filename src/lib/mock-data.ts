export type QuestionType = "single" | "multiple";

export type Question = {
  id: string;
  stem: string;
  options: { key: string; text: string }[];
  answer: string[];
  explanation: string;
  type: QuestionType;
  aiGeneratedAnswer?: boolean;
  aiGeneratedExplanation?: boolean;
  favorited?: boolean;
  wrongCount?: number;
};

export type LibraryStatus = "ready" | "importing";

/** 与新建/导入任务开始时相同的进度结构：N 页提取 + (N-1) 次跨页拼接 */
export type ImportProgress = {
  /** 已完成子任务数 */
  completed: number;
  /** 总任务数 = pageCount + max(0, pageCount - 1)（CSV 无拼接时可为 1） */
  total: number;
  pageCount: number;
  /** 当前阶段文案 */
  phaseLabel: string;
  /** 加速券是否启用 */
  accelerated?: boolean;
};

export type Library = {
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
  source: "upload" | "csv";
  status: LibraryStatus;
  importProgress?: ImportProgress;
};

export function computeTaskTotal(pageCount: number, source: "upload" | "csv") {
  if (source === "csv" || pageCount <= 0) return Math.max(pageCount, 1);
  // 按页提取 + 相邻页拼接判断
  return pageCount + Math.max(0, pageCount - 1);
}

export type UserProfile = {
  account: string;
  email: string;
  speedTickets: number;
  libraryCount: number;
  libraryLimit: number;
};

export const mockUser: UserProfile = {
  account: "zhangming",
  email: "zhangming@example.com",
  speedTickets: 2,
  libraryCount: 3,
  libraryLimit: 10,
};

export const mockLibraries: Library[] = [
  {
    id: "lib-importing",
    name: "微观经济学期中卷",
    questionCount: 0,
    createdAt: "2026-07-29",
    updatedAt: "2026-07-29",
    source: "upload",
    status: "importing",
    importProgress: {
      completed: 7,
      total: 19, // 10 页提取 + 9 次拼接（演示）
      pageCount: 10,
      phaseLabel: "正在提取第 5 页题目…",
      accelerated: true,
    },
  },
  {
    id: "lib-1",
    name: "高等数学期末真题 2024",
    questionCount: 48,
    createdAt: "2026-03-12",
    updatedAt: "2026-03-18",
    source: "upload",
    status: "ready",
  },
  {
    id: "lib-2",
    name: "线性代数章节练习",
    questionCount: 32,
    createdAt: "2026-02-28",
    updatedAt: "2026-03-01",
    source: "csv",
    status: "ready",
  },
  {
    id: "lib-3",
    name: "概率论选择题精选",
    questionCount: 26,
    createdAt: "2026-01-15",
    updatedAt: "2026-02-10",
    source: "upload",
    status: "ready",
  },
];

export const mockQuestions: Question[] = [
  {
    id: "q1",
    stem: "设函数 $f(x)=x^{3}-3x+1$，则 $f(x)$ 在区间 $[-2,2]$ 上的最小值是？",
    options: [
      { key: "A", text: "$-1$" },
      { key: "B", text: "$-3$" },
      { key: "C", text: "$1$" },
      { key: "D", text: "$-5$" },
    ],
    answer: ["B"],
    explanation:
      "对 $f(x)$ 求导得 $f'(x)=3x^{2}-3=3(x-1)(x+1)$。驻点 $x=\\pm 1$。比较端点与驻点函数值：$f(-2)=-1$，$f(-1)=3$，$f(1)=-1$，$f(2)=3$。结合极值分析得最小值为 $-3$。",
    type: "single",
    favorited: true,
    wrongCount: 2,
  },
  {
    id: "q2",
    stem: "下列关于矩阵特征值的说法中，正确的有？",
    options: [
      { key: "A", text: "相似矩阵有相同的特征值" },
      { key: "B", text: "特征值一定是实数" },
      { key: "C", text: "可逆矩阵的特征值均不为零" },
      { key: "D", text: "对角矩阵的特征值即为其对角元" },
    ],
    answer: ["A", "C", "D"],
    explanation:
      "相似矩阵特征多项式相同，故特征值相同。特征值可为复数。可逆矩阵行列式非零，特征值之积等于行列式，故均非零。对角矩阵特征值为对角元。",
    type: "multiple",
    aiGeneratedExplanation: true,
    favorited: false,
    wrongCount: 1,
  },
  {
    id: "q3",
    stem: "抛掷一枚均匀硬币三次，恰好出现两次正面的概率是？",
    options: [
      { key: "A", text: "$\\dfrac{1}{8}$" },
      { key: "B", text: "$\\dfrac{1}{4}$" },
      { key: "C", text: "$\\dfrac{3}{8}$" },
      { key: "D", text: "$\\dfrac{1}{2}$" },
    ],
    answer: ["C"],
    explanation:
      "二项分布：$\\dbinom{3}{2}\\left(\\dfrac{1}{2}\\right)^{3}=\\dfrac{3}{8}$。",
    type: "single",
    aiGeneratedAnswer: true,
    aiGeneratedExplanation: true,
    wrongCount: 0,
  },
  {
    id: "q4",
    stem: "若 $\\displaystyle\\lim_{x\\to 0}\\dfrac{\\sin kx}{x}=2$，则 $k$ 的值为？",
    options: [
      { key: "A", text: "$1$" },
      { key: "B", text: "$2$" },
      { key: "C", text: "$\\dfrac{1}{2}$" },
      { key: "D", text: "$-2$" },
    ],
    answer: ["B"],
    explanation:
      "$$\\lim_{x\\to 0}\\dfrac{\\sin kx}{x}=k\\cdot\\lim_{x\\to 0}\\dfrac{\\sin kx}{kx}=k=2$$",
    type: "single",
    favorited: true,
    wrongCount: 3,
  },
];

export const mockPageImages = [
  { id: "p1", label: "第 1 页", url: "https://picsum.photos/seed/exam-page-1/480/640" },
  { id: "p2", label: "第 2 页", url: "https://picsum.photos/seed/exam-page-2/480/640" },
  { id: "p3", label: "第 3 页", url: "https://picsum.photos/seed/exam-page-3/480/640" },
  { id: "p4", label: "第 4 页", url: "https://picsum.photos/seed/exam-page-4/480/640" },
];

export const emptyLibraries: Library[] = [];
