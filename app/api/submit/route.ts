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
  let { questionId, userAnswer, isCorrect } = body;
  questionId = Number(questionId); // Ensure number

  console.log(
    `[Submit] User: ${session.user.id}, Question: ${questionId}, Answer: ${userAnswer}, Correct: ${isCorrect}`
  );

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

  let resultAction = "";
  let oldState = null;
  let newState = null;

  if (existingState.length > 0) {
    oldState = existingState[0];
    console.log(
      `[Submit] Updating existing state. ID: ${existingState[0].id}, Prev Wrong: ${existingState[0].wrongCount}, Prev Correct: ${existingState[0].correctCount}`
    );

    const updateData = {
      wrongCount: isCorrect
        ? 0 // Reset wrong count if answered correctly to remove from "Incorrect" category
        : (existingState[0].wrongCount || 0) + 1,
      correctCount: isCorrect
        ? (existingState[0].correctCount || 0) + 1
        : existingState[0].correctCount || 0,
      lastAnsweredAt: new Date(),
      updatedAt: new Date(),
    };

    newState = updateData;
    resultAction = "updated";

    await db
      .update(userQuestionState)
      .set(updateData)
      .where(eq(userQuestionState.id, existingState[0].id));
  } else {
    console.log(`[Submit] Creating new state.`);
    resultAction = "created";

    const insertData = {
      userId: session.user.id,
      questionId,
      wrongCount: isCorrect ? 0 : 1,
      correctCount: isCorrect ? 1 : 0,
      lastAnsweredAt: new Date(),
    };
    newState = insertData;

    await db.insert(userQuestionState).values(insertData);
  }

  return NextResponse.json({
    success: true,
    action: resultAction,
    oldState,
    newState,
  });
}
