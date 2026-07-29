import "dotenv/config";

export const env = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "mysql://zpdf:zpdf@127.0.0.1:3307/zpdf_practice",
  authSecret:
    process.env.AUTH_SECRET ?? "zpdf-practice-dev-secret-change-me",
  sessionCookie: process.env.SESSION_COOKIE ?? "zpdf_session",
  geminiBaseUrl: (
    process.env.GEMINI_BASE_URL ?? "https://api.openjk.online"
  ).replace(/\/$/, ""),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  libraryLimit: 10,
};
