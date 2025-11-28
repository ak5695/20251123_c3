import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProgress, userQuestionState } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { questionId, userAnswer, isCorrect } = body;

  // Record the attempt
  await db.insert(userProgress).values({
    userId: session.user.id,
    questionId,
    userAnswer,
    isCorrect,
  });

  // Update aggregated state
  const existingState = await db
    .select()
    .from(userQuestionState)
    .where(
      and(
        eq(userQuestionState.userId, session.user.id),
        eq(userQuestionState.questionId, questionId)
      )
    )
    .limit(1);

  if (existingState.length > 0) {
    await db
      .update(userQuestionState)
      .set({
        wrongCount: isCorrect
          ? 0 // Reset wrong count if answered correctly to remove from "Incorrect" category
          : existingState[0].wrongCount + 1,
        correctCount: isCorrect
          ? existingState[0].correctCount + 1
          : existingState[0].correctCount,
        lastAnsweredAt: new Date(),
      })
      .where(eq(userQuestionState.id, existingState[0].id));
  } else {
    await db.insert(userQuestionState).values({
      userId: session.user.id,
      questionId,
      wrongCount: isCorrect ? 0 : 1,
      correctCount: isCorrect ? 1 : 0,
      lastAnsweredAt: new Date(),
    });
  }

  return NextResponse.json({ success: true });
}
