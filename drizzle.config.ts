import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    // 主机端口 3307（避开默认 3306）
    url:
      process.env.DATABASE_URL ??
      "mysql://zpdf:zpdf@127.0.0.1:3307/zpdf_practice",
  },
});
