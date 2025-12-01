import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, userQuestionState } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  try {
    let categoryStats;

    if (session) {
      console.log(`[Stats] Fetching stats for user: ${session.user.id}`);
      // Fetch stats grouped by category for logged-in user
      categoryStats = await db
        .select({
          category: questions.category,
          total: sql<number>`count(*)::int`,
          unanswered: sql<number>`count(*) filter (where ${userQuestionState.id} is null or (coalesce(${userQuestionState.correctCount}, 0) = 0 and coalesce(${userQuestionState.wrongCount}, 0) = 0))::int`,
          correct: sql<number>`count(*) filter (where ${userQuestionState.correctCount} > 0 and coalesce(${userQuestionState.wrongCount}, 0) = 0)::int`,
          incorrect: sql<number>`count(*) filter (where ${userQuestionState.wrongCount} > 0)::int`,
          collected: sql<number>`count(*) filter (where ${userQuestionState.isCollected} = true)::int`,
          viewed: sql<number>`count(*) filter (where ${userQuestionState.isRecited} = true)::int`,
        })
        .from(questions)
        .leftJoin(
          userQuestionState,
          and(
            eq(questions.id, userQuestionState.questionId),
            eq(userQuestionState.userId, session.user.id)
          )
        )
        .groupBy(questions.category);

      // console.log(`[Stats] Raw category stats:`, categoryStats);
    } else {
      // Fetch only totals for guests
      const rawStats = await db
        .select({
          category: questions.category,
          total: sql<number>`count(*)::int`,
        })
        .from(questions)
        .groupBy(questions.category);

      categoryStats = rawStats.map((stat) => ({
        ...stat,
        unanswered: stat.total, // For guests, all are effectively unanswered/unviewed
        correct: 0,
        incorrect: 0,
        collected: 0,
        viewed: 0,
        unviewed: stat.total,
      }));
    }

    // Calculate "All" stats
    const allStats = categoryStats.reduce(
      (acc, curr) => ({
        category: "全部",
        total: acc.total + curr.total,
        unanswered: acc.unanswered + curr.unanswered,
        correct: acc.correct + curr.correct,
        incorrect: acc.incorrect + curr.incorrect,
        collected: acc.collected + curr.collected,
        viewed: acc.viewed + curr.viewed,
      }),
      {
        category: "全部",
        total: 0,
        unanswered: 0,
        correct: 0,
        incorrect: 0,
        collected: 0,
        viewed: 0,
      }
    );

    // Add "unviewed" to each
    const formattedStats = [allStats, ...categoryStats].map((stat) => ({
      ...stat,
      unviewed: stat.total - stat.viewed,
    }));

    return NextResponse.json(formattedStats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
