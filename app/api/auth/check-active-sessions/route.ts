import { db } from "@/lib/db";
import { session, user } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // 通过 email 查找用户
    const foundUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!foundUser) {
      // 用户不存在，返回无活跃会话（让正常登录流程处理错误）
      return NextResponse.json({ hasActiveSessions: false });
    }

    // 检查该用户是否有活跃会话
    const activeSessions = await db
      .select()
      .from(session)
      .where(
        and(eq(session.userId, foundUser.id), gt(session.expiresAt, new Date()))
      );

    return NextResponse.json({
      hasActiveSessions: activeSessions.length > 0,
      sessionCount: activeSessions.length,
    });
  } catch (error) {
    console.error("Error checking active sessions:", error);
    return NextResponse.json(
      { error: "Failed to check sessions" },
      { status: 500 }
    );
  }
}
