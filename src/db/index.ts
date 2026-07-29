import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "mysql://zpdf:zpdf@127.0.0.1:3307/zpdf_practice";

const globalForDb = globalThis as unknown as {
  mysqlPool?: mysql.Pool;
};

const pool =
  globalForDb.mysqlPool ??
  mysql.createPool({
    uri: connectionString,
    connectionLimit: 10,
    waitForConnections: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.mysqlPool = pool;
}

export const db = drizzle(pool, { schema, mode: "default" });
export { schema };
