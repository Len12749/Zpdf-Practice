/**
 * AI 提取 / 补全题目时必须遵守的 LaTeX 规范。
 * 后续接 Gemini 等模型时，将 LATEX_PROMPT_BLOCK 拼入 system / instruction。
 */

export const LATEX_PROMPT_BLOCK = `
## 数学公式（LaTeX）输出规范（必须遵守）

1. 所有数学表达式必须使用标准 LaTeX，禁止用 Unicode 伪公式代替（禁止 x²、√、∫ 等混排当最终输出；应写 $x^{2}$、$\\sqrt{}$、$\\int$）。
2. 行内公式用 $...$ 包裹，例如：设函数 $f(x)=x^{3}-3x+1$。
3. 独立成行的重要公式用 $$...$$ 包裹。
4. 定界符必须成对闭合；内容中若出现字面量 $，需写成 \\$。
5. 常用命令规范：
   - 分数：\\frac{a}{b}
   - 根号：\\sqrt{x}、\\sqrt[n]{x}
   - 上下标：x^{2}、a_{n}、a_{n}^{2}
   - 极限：\\lim_{x \\to 0}
   - 求和/积分：\\sum_{i=1}^{n}、\\int_{a}^{b}
   - 希腊字母：\\alpha、\\beta、\\theta、\\pi
   - 向量/矩阵：\\vec{a}、\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}
   - 不等号：\\le、\\ge、\\neq、\\approx
   - 乘号/点乘：\\times、\\cdot
6. 中文叙述与公式混排：中文在 $ 外，公式在 $ 内。例：则 $f(x)$ 在区间 $[-2,2]$ 上的最小值是？
7. 选项中的纯数字可不用公式；含字母、指数、分数、根式时必须用 LaTeX。
8. 题干、选项、解析、答案字段凡含数学内容均须遵守本规范。
9. 不要输出 KaTeX 不支持的宏包命令；优先使用 amsmath 常见子集。
10. 公式只使用 $ / $$ 定界；不要用 Markdown 代码块包裹整段题目。
11. 允许使用 Markdown 表格（GFM）：当题干/解析中有对照表、真值表、分类表时，使用标准 Markdown 表格语法，例如：
| 列1 | 列2 |
| --- | --- |
| a | b |
12. 表格单元格内的数学仍用 $...$ 包裹。
13. **必须保持原文换行**：题干、选项、解析中的多行结构不得压成一行；JSON 字符串内用 \\n 表示换行。
`.trim();

/** 供后续 function-calling / schema 字段说明复用 */
export const LATEX_FIELD_HINT =
  "数学用 LaTeX（$...$ / $$...$$）；表格用 Markdown GFM。禁止 Unicode 伪公式。";
