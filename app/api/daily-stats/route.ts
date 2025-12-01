import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProgress, userQuestionState, user } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is paid
  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!dbUser?.isPaid) {
    return NextResponse.json({ error: "Premium feature" }, { status: 403 });
  }

  // Check if subscription is expired
  if (
    dbUser.subscriptionExpiresAt &&
    new Date() > dbUser.subscriptionExpiresAt
  ) {
    return NextResponse.json(
      { error: "Subscription expired" },
      { status: 403 }
    );
  }

  try {
    // Get daily stats from userProgress (correct/incorrect per day)
    const dailyAnswerStats = await db
      .select({
        date: sql<string>`DATE(${userProgress.createdAt})::text`,
        correct: sql<number>`COUNT(*) FILTER (WHERE ${userProgress.isCorrect} = true)::int`,
        incorrect: sql<number>`COUNT(*) FILTER (WHERE ${userProgress.isCorrect} = false)::int`,
      })
      .from(userProgress)
      .where(eq(userProgress.userId, session.user.id))
      .groupBy(sql`DATE(${userProgress.createdAt})`)
      .orderBy(sql`DATE(${userProgress.createdAt}) DESC`);

    // Get daily collected stats from userQuestionState
    // We need to track when items were collected, but updatedAt might not reflect collection time
    // For now, we'll use a simplified approach based on createdAt/updatedAt
    const dailyCollectedStats = await db
      .select({
        date: sql<string>`DATE(${userQuestionState.updatedAt})::text`,
        collected: sql<number>`COUNT(*) FILTER (WHERE ${userQuestionState.isCollected} = true)::int`,
        viewed: sql<number>`COUNT(*) FILTER (WHERE ${userQuestionState.isRecited} = true)::int`,
      })
      .from(userQuestionState)
      .where(eq(userQuestionState.userId, session.user.id))
      .groupBy(sql`DATE(${userQuestionState.updatedAt})`)
      .orderBy(sql`DATE(${userQuestionState.updatedAt}) DESC`);

    // Merge stats by date
    const statsMap = new Map<
      string,
      {
        date: string;
        correct: number;
        incorrect: number;
        collected: number;
        viewed: number;
      }
    >();

    // Initialize with answer stats
    for (const stat of dailyAnswerStats) {
      statsMap.set(stat.date, {
        date: stat.date,
        correct: stat.correct,
        incorrect: stat.incorrect,
        collected: 0,
        viewed: 0,
      });
    }

    // Merge collected/viewed stats
    for (const stat of dailyCollectedStats) {
      const existing = statsMap.get(stat.date);
      if (existing) {
        existing.collected = stat.collected;
        existing.viewed = stat.viewed;
      } else {
        statsMap.set(stat.date, {
          date: stat.date,
          correct: 0,
          incorrect: 0,
          collected: stat.collected,
          viewed: stat.viewed,
        });
      }
    }

    // Calculate totals
    const totals = {
      correct: 0,
      incorrect: 0,
      collected: 0,
      viewed: 0,
    };

    // Get total collected and viewed (current state, not daily)
    const [totalState] = await db
      .select({
        collected: sql<number>`COUNT(*) FILTER (WHERE ${userQuestionState.isCollected} = true)::int`,
        viewed: sql<number>`COUNT(*) FILTER (WHERE ${userQuestionState.isRecited} = true)::int`,
      })
      .from(userQuestionState)
      .where(eq(userQuestionState.userId, session.user.id));

    // Get total correct and incorrect from progress
    const [totalProgress] = await db
      .select({
        correct: sql<number>`COUNT(*) FILTER (WHERE ${userProgress.isCorrect} = true)::int`,
        incorrect: sql<number>`COUNT(*) FILTER (WHERE ${userProgress.isCorrect} = false)::int`,
      })
      .from(userProgress)
      .where(eq(userProgress.userId, session.user.id));

    totals.correct = totalProgress?.correct || 0;
    totals.incorrect = totalProgress?.incorrect || 0;
    totals.collected = totalState?.collected || 0;
    totals.viewed = totalState?.viewed || 0;

    // Convert map to sorted array
    const dailyStats = Array.from(statsMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      totals,
      dailyStats,
    });
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
