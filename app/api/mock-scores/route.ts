import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mockExamScores, userQuestionState } from "@/lib/db/schema";
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
  const { score, totalQuestions, correctCount, answers } = body;

  if (
    typeof score !== "number" ||
    typeof totalQuestions !== "number" ||
    typeof correctCount !== "number"
  ) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Start a transaction to ensure data consistency
  await db.transaction(async (tx) => {
    // 1. Save the mock exam score
    await tx.insert(mockExamScores).values({
      userId: session.user.id,
      score,
      totalQuestions,
      correctCount,
    });

    // 2. Update userQuestionState for each answer if provided
    if (Array.isArray(answers) && answers.length > 0) {
      // We'll process these in parallel or batch if possible, but for now simple loop
      // To optimize, we could use `ON CONFLICT` upsert if supported by the driver/ORM easily for batch
      // But here we might need to check existing state for each.
      // Actually, we can just use the same logic as /api/submit but in batch.

      // Let's iterate and update.
      for (const ans of answers) {
        const { questionId, isCorrect, isAnswered } = ans;
        if (!questionId) continue;
        if (isAnswered === false) continue; // Skip unanswered questions

        // We need to update correctCount/wrongCount and lastAnsweredAt
        // We can use a raw SQL upsert for better performance or just simple logic
        // For simplicity and safety with Drizzle:

        // Check if record exists
        const existing = await tx.query.userQuestionState.findFirst({
          where: and(
            eq(userQuestionState.userId, session.user.id),
            eq(userQuestionState.questionId, questionId)
          ),
        });

        if (existing) {
          await tx
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
        } else {
          await tx.insert(userQuestionState).values({
            userId: session.user.id,
            questionId,
            isCollected: false,
            isRecited: false,
            correctCount: isCorrect ? 1 : 0,
            wrongCount: !isCorrect ? 1 : 0,
            lastAnsweredAt: new Date(),
          });
        }
      }
    }
  });

  return NextResponse.json({ success: true });
}
