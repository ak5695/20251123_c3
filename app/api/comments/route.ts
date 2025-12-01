import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments, user } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// 获取某道题的所有评论
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json(
      { error: "Question ID is required" },
      { status: 400 }
    );
  }

  const questionComments = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      userName: comments.userName,
      content: comments.content,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(eq(comments.questionId, parseInt(questionId)))
    .orderBy(desc(comments.createdAt));

  return NextResponse.json(questionComments);
}

// 添加评论
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 检查是否付费会员
  const userData = await db
    .select({ isPaid: user.isPaid })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!userData[0]?.isPaid) {
    return NextResponse.json({ error: "请先开通会员" }, { status: 403 });
  }

  const body = await req.json();
  const { questionId, content } = body;

  if (!questionId || !content?.trim()) {
    return NextResponse.json(
      { error: "题目ID和评论内容不能为空" },
      { status: 400 }
    );
  }

  // 评论内容长度限制
  if (content.length > 500) {
    return NextResponse.json(
      { error: "评论内容不能超过500字" },
      { status: 400 }
    );
  }

  const newComment = await db
    .insert(comments)
    .values({
      userId: session.user.id,
      userName: session.user.name || "匿名用户",
      questionId,
      content: content.trim(),
    })
    .returning();

  return NextResponse.json(newComment[0]);
}

// 删除评论（仅限本人）
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const { commentId } = body;

  if (!commentId) {
    return NextResponse.json({ error: "评论ID不能为空" }, { status: 400 });
  }

  // 检查评论是否属于当前用户
  const comment = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!comment[0]) {
    return NextResponse.json({ error: "评论不存在" }, { status: 404 });
  }

  if (comment[0].userId !== session.user.id) {
    return NextResponse.json({ error: "无权删除他人评论" }, { status: 403 });
  }

  await db.delete(comments).where(eq(comments.id, commentId));

  return NextResponse.json({ success: true });
}
