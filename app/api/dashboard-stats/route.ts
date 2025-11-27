import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, userQuestionState } from "@/lib/db/schema";
import { eq, and, sql, isNull, or } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get total questions count
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(questions);

    // Get unanswered (not practiced) count
    const [{ unanswered }] = await db
      .select({ unanswered: sql<number>`count(*)` })
      .from(questions)
      .leftJoin(
        userQuestionState,
        and(
          eq(questions.id, userQuestionState.questionId),
          eq(userQuestionState.userId, session.user.id)
        )
      )
      .where(
        or(
          isNull(userQuestionState.questionId),
          and(
            sql`COALESCE(${userQuestionState.correctCount}, 0) = 0`,
            sql`COALESCE(${userQuestionState.wrongCount}, 0) = 0`
          )
        )
      );

    // Get wrong answers count (questions with wrong > 0)
    const [{ wrongAnswers }] = await db
      .select({ wrongAnswers: sql<number>`count(*)` })
      .from(userQuestionState)
      .where(
        and(
          eq(userQuestionState.userId, session.user.id),
          sql`${userQuestionState.wrongCount} > 0`
        )
      );

    // Get collected count
    const [{ collected }] = await db
      .select({ collected: sql<number>`count(*)` })
      .from(userQuestionState)
      .where(
        and(
          eq(userQuestionState.userId, session.user.id),
          eq(userQuestionState.isCollected, true)
        )
      );

    // Calculate unmemorized count (total - questions with correctCount > 0)
    const [{ memorizedCount }] = await db
      .select({ memorizedCount: sql<number>`count(*)` })
      .from(userQuestionState)
      .where(
        and(
          eq(userQuestionState.userId, session.user.id),
          sql`${userQuestionState.correctCount} > 0`
        )
      );

    const unmemorized = total - memorizedCount;

    return NextResponse.json({
      total: 2965,
      unanswered,
      wrongAnswers,
      collected,
      unmemorized,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
