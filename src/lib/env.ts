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
  libraryLimit: 10,
};
