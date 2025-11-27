import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, userQuestionState } from "@/lib/db/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notes = await db
    .select({
      id: questions.id,
      content: questions.content,
      type: questions.type,
      options: questions.options,
      answer: questions.answer,
      explanation: questions.explanation,
      mnemonic: questions.mnemonic,
      category: questions.category,
      note: userQuestionState.note,
      updatedAt: userQuestionState.lastAnsweredAt,
    })
    .from(userQuestionState)
    .innerJoin(questions, eq(userQuestionState.questionId, questions.id))
    .where(
      and(
        eq(userQuestionState.userId, session.user.id),
        isNotNull(userQuestionState.note)
      )
    )
    .orderBy(desc(userQuestionState.updatedAt));

  return NextResponse.json(notes);
}
