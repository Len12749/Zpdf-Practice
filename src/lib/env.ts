import "dotenv/config";

export const env = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "mysql://zpdf:zpdf@127.0.0.1:3307/zpdf_practice",
  authSecret:
    process.env.AUTH_SECRET ?? "zpdf-practice-dev-secret-change-me",
  sessionCookie: process.env.SESSION_COOKIE ?? "zpdf_session",
  /** 管理后台账号（独立于普通用户表） */
  adminAccount: process.env.ADMIN_ACCOUNT ?? "Sen",
  adminPassword: process.env.ADMIN_PASSWORD ?? "liusen12749",
  adminCookie: process.env.ADMIN_COOKIE ?? "zpdf_admin_session",
  geminiBaseUrl: (
    process.env.GEMINI_BASE_URL ?? "https://api.openjk.online"
  ).replace(/\/$/, ""),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  /**
   * 是否打印模型完整输出到终端，并写入 .tmp/model-logs/
   * 设 GEMINI_LOG_OUTPUT=1 开启（排查 JSON/提取问题时用）
   */
  geminiLogOutput:
    process.env.GEMINI_LOG_OUTPUT === "1" ||
    process.env.GEMINI_LOG_OUTPUT === "true",
  libraryLimit: 10,
};
