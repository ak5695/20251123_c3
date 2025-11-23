import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, userQuestionState } from "@/lib/db/schema";
import { eq, sql, and, count } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get total questions per category
  const totalStats = await db
    .select({
      category: questions.category,
      count: count(questions.id),
    })
    .from(questions)
    .groupBy(questions.category);

  // Get user progress per category
  // We need to join questions with userQuestionState
  const userStats = await db
    .select({
      category: questions.category,
      count: count(userQuestionState.questionId),
    })
    .from(userQuestionState)
    .innerJoin(questions, eq(userQuestionState.questionId, questions.id))
    .where(
      and(
        eq(userQuestionState.userId, session.user.id),
        sql`(${userQuestionState.correctCount} > 0 OR ${userQuestionState.wrongCount} > 0)`
      )
    )
    .groupBy(questions.category);

  // Merge stats
  const stats = totalStats.map((total) => {
    const user = userStats.find((u) => u.category === total.category);
    return {
      category: total.category,
      total: total.count,
      answered: user ? user.count : 0,
    };
  });

  return NextResponse.json(stats);
}
