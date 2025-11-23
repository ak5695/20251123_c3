import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProgress, questions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await db
    .select({
      id: userProgress.id,
      questionId: userProgress.questionId,
      userAnswer: userProgress.userAnswer,
      isCorrect: userProgress.isCorrect,
      createdAt: userProgress.createdAt,
      questionContent: questions.content,
      questionType: questions.type,
      correctAnswer: questions.answer,
    })
    .from(userProgress)
    .innerJoin(questions, eq(userProgress.questionId, questions.id))
    .where(eq(userProgress.userId, session.user.id))
    .orderBy(desc(userProgress.createdAt))
    .limit(50);

  return NextResponse.json(records);
}
