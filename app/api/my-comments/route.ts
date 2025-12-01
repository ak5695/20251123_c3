import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments, questions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// 获取当前用户的所有评论
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const myComments = await db
    .select({
      id: comments.id,
      questionId: comments.questionId,
      content: comments.content,
      createdAt: comments.createdAt,
      questionContent: questions.content,
      questionType: questions.type,
      questionOptions: questions.options,
      questionAnswer: questions.answer,
      questionCategory: questions.category,
    })
    .from(comments)
    .innerJoin(questions, eq(comments.questionId, questions.id))
    .where(eq(comments.userId, session.user.id))
    .orderBy(desc(comments.createdAt));

  return NextResponse.json(myComments);
}
