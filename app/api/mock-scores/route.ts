import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  mockExamScores,
  userQuestionState,
  userProgress,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scores = await db
    .select()
    .from(mockExamScores)
    .where(eq(mockExamScores.userId, session.user.id))
    .orderBy(desc(mockExamScores.createdAt));

  return NextResponse.json(scores);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { score, totalQuestions, correctCount, answeredCount, answers } = body;

  console.log("Mock Exam Submission:", {
    userId: session.user.id,
    score,
    answersCount: answers?.length,
    answeredCount,
  });

  if (
    typeof score !== "number" ||
    typeof totalQuestions !== "number" ||
    typeof correctCount !== "number"
  ) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Start a transaction to ensure data consistency
  try {
    // 1. Save the mock exam score
    await db.insert(mockExamScores).values({
      userId: session.user.id,
      score,
      totalQuestions,
      correctCount,
      answeredCount: answeredCount || 0,
    });

    let processedCount = 0;
    let updatedCount = 0;
    let insertedCount = 0;

    // 2. Update userQuestionState for each answer if provided
    if (Array.isArray(answers) && answers.length > 0) {
      for (const ans of answers) {
        const { questionId, isCorrect, isAnswered, userAnswer } = ans;
        const qId = Number(questionId);

        if (!qId || isNaN(qId)) continue;
        if (isAnswered === false) continue; // Skip unanswered questions

        processedCount++;

        // 1. Insert into userProgress (Record the attempt)
        await db.insert(userProgress).values({
          userId: session.user.id,
          questionId: qId,
          userAnswer: userAnswer || "",
          isCorrect,
        });

        // 2. Update userQuestionState (Aggregated stats)
        // Check if record exists
        const existingList = await db
          .select()
          .from(userQuestionState)
          .where(
            and(
              eq(userQuestionState.userId, session.user.id),
              eq(userQuestionState.questionId, qId)
            )
          )
          .limit(1);

        const existing = existingList[0];

        if (existing) {
          await db
            .update(userQuestionState)
            .set({
              correctCount: isCorrect
                ? existing.correctCount + 1
                : existing.correctCount,
              wrongCount: !isCorrect
                ? existing.wrongCount + 1
                : existing.wrongCount,
              lastAnsweredAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(userQuestionState.id, existing.id));
          updatedCount++;
        } else {
          await db.insert(userQuestionState).values({
            userId: session.user.id,
            questionId: qId,
            isCollected: false,
            isRecited: false,
            correctCount: isCorrect ? 1 : 0,
            wrongCount: !isCorrect ? 1 : 0,
            lastAnsweredAt: new Date(),
          });
          insertedCount++;
        }
      }
      console.log("Mock Exam Stats Update:", {
        processedCount,
        updatedCount,
        insertedCount,
      });
    }

    const result = { processedCount, updatedCount, insertedCount };
    return NextResponse.json({ success: true, stats: result });
  } catch (error) {
    // Log full error and stack for easier debugging in development
    console.error("Mock Exam Transaction Error:", error);
    if (error instanceof Error) console.error(error.stack);

    // Return underlying error message in development to aid debugging
    const message =
      process.env.NODE_ENV === "production"
        ? "Failed to save mock exam results"
        : (error as Error).message || "Failed to save mock exam results";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
