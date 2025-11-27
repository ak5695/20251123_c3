import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userQuestionState } from "@/lib/db/schema";
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
  const { questionId, isCollected, isRecited } = body;

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

  // 准备更新的数据
  const updateData: any = {
    lastAnsweredAt: new Date(),
    updatedAt: new Date(),
  };

  if (isCollected !== undefined) {
    updateData.isCollected = isCollected;
  }

  if (isRecited !== undefined) {
    updateData.isRecited = isRecited;
  }

  if (existingState.length > 0) {
    await db
      .update(userQuestionState)
      .set(updateData)
      .where(eq(userQuestionState.id, existingState[0].id));
  } else {
    await db.insert(userQuestionState).values({
      userId: session.user.id,
      questionId,
      isCollected: isCollected || false,
      isRecited: isRecited || false,
      wrongCount: 0,
      correctCount: 0,
      lastAnsweredAt: new Date(),
    });
  }

  return NextResponse.json({ success: true });
}
