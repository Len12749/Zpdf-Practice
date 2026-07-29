import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  checkIns,
  favorites,
  libraries,
  libraryPages,
  questions,
  users,
  wrongQuestions,
} from "@/db/schema";
import { cancelExtractJob } from "@/lib/extract-job";
import { cleanupLibraryFiles } from "@/lib/storage";

export async function listUsersForAdmin() {
  const rows = await db
    .select({
      id: users.id,
      account: users.account,
      email: users.email,
      speedTickets: users.speedTickets,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt));

  return rows.map((u) => ({
    id: u.id,
    account: u.account,
    email: u.email,
    speedTickets: u.speedTickets,
    createdAt:
      u.createdAt instanceof Date
        ? u.createdAt.toISOString()
        : String(u.createdAt),
  }));
}

export async function setUserSpeedTickets(userId: string, tickets: number) {
  const n = Math.max(0, Math.min(9999, Math.floor(tickets)));
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;

  await db
    .update(users)
    .set({ speedTickets: n, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return n;
}

/** 彻底删除用户及其题库、题目、收藏、错题、签到与临时文件 */
export async function deleteUserCompletely(userId: string) {
  const [u] = await db
    .select({ id: users.id, account: users.account })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;

  const libs = await db
    .select({ id: libraries.id })
    .from(libraries)
    .where(eq(libraries.userId, userId));
  const libIds = libs.map((l) => l.id);

  if (libIds.length) {
    for (const id of libIds) {
      cancelExtractJob(id);
    }

    const qs = await db
      .select({ id: questions.id })
      .from(questions)
      .where(inArray(questions.libraryId, libIds));
    const qIds = qs.map((q) => q.id);

    if (qIds.length) {
      await db.delete(favorites).where(inArray(favorites.questionId, qIds));
      await db
        .delete(wrongQuestions)
        .where(inArray(wrongQuestions.questionId, qIds));
      await db.delete(questions).where(inArray(questions.libraryId, libIds));
    }

    await db
      .delete(libraryPages)
      .where(inArray(libraryPages.libraryId, libIds));
    await db
      .delete(wrongQuestions)
      .where(inArray(wrongQuestions.libraryId, libIds));
    await db.delete(libraries).where(inArray(libraries.id, libIds));

    await Promise.all(libIds.map((id) => cleanupLibraryFiles(id)));
  }

  await db.delete(favorites).where(eq(favorites.userId, userId));
  await db.delete(wrongQuestions).where(eq(wrongQuestions.userId, userId));
  await db.delete(checkIns).where(eq(checkIns.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  return { id: u.id, account: u.account };
}
