import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
/** 账号：账号 + 密码 + 联系邮箱 */
export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    account: varchar("account", { length: 64 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    speedTickets: int("speed_tickets").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [uniqueIndex("users_account_uidx").on(t.account)],
);

/** 签到记录：一天一条 */
export const checkIns = mysqlTable(
  "check_ins",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 }).notNull(),
    /** YYYY-MM-DD */
    day: varchar("day", { length: 10 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("check_ins_user_day_uidx").on(t.userId, t.day),
    index("check_ins_user_idx").on(t.userId),
  ],
);

/** 题库，每用户最多 10 个（应用层校验） */
export const libraries = mysqlTable(
  "libraries",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    source: mysqlEnum("source", ["upload", "csv"]).notNull().default("upload"),
    status: mysqlEnum("status", ["ready", "importing", "failed"])
      .notNull()
      .default("ready"),
    questionCount: int("question_count").notNull().default(0),
    importCompleted: int("import_completed").notNull().default(0),
    importTotal: int("import_total").notNull().default(0),
    importPageCount: int("import_page_count").notNull().default(0),
    importPhaseLabel: text("import_phase_label"),
    importAccelerated: boolean("import_accelerated").notNull().default(false),
    importError: text("import_error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("libraries_user_idx").on(t.userId)],
);

/**
 * 题目
 * options: [{ key: "A", text: "..." }, ...]
 * answer: ["A"] 或 ["A","C"]
 */
export const questions = mysqlTable(
  "questions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    libraryId: varchar("library_id", { length: 36 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    stem: text("stem").notNull(),
    options: json("options").$type<{ key: string; text: string }[]>().notNull(),
    answer: json("answer").$type<string[]>().notNull(),
    explanation: text("explanation").notNull(),
    type: mysqlEnum("type", ["single", "multiple"]).notNull().default("single"),
    aiGeneratedAnswer: boolean("ai_generated_answer").notNull().default(false),
    aiGeneratedExplanation: boolean("ai_generated_explanation")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("questions_library_idx").on(t.libraryId)],
);

export const favorites = mysqlTable(
  "favorites",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 }).notNull(),
    questionId: varchar("question_id", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("favorites_user_q_uidx").on(t.userId, t.questionId),
    index("favorites_user_idx").on(t.userId),
  ],
);

export const wrongQuestions = mysqlTable(
  "wrong_questions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 }).notNull(),
    questionId: varchar("question_id", { length: 36 }).notNull(),
    libraryId: varchar("library_id", { length: 36 }).notNull(),
    wrongCount: int("wrong_count").notNull().default(1),
    lastWrongAt: timestamp("last_wrong_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    uniqueIndex("wrong_user_q_uidx").on(t.userId, t.questionId),
    index("wrong_user_lib_idx").on(t.userId, t.libraryId),
  ],
);

/** 上传页图片路径 */
export const libraryPages = mysqlTable(
  "library_pages",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    libraryId: varchar("library_id", { length: 36 }).notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    filePath: text("file_path").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("library_pages_lib_idx").on(t.libraryId)],
);

export type User = typeof users.$inferSelect;
export type Library = typeof libraries.$inferSelect;
export type Question = typeof questions.$inferSelect;
