import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取用户付费状态
    const userData = await db
      .select({
        isPaid: user.isPaid,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userInfo = userData[0];
    const now = new Date();

    // 检查订阅是否过期
    const isSubscriptionValid =
      userInfo.isPaid &&
      userInfo.subscriptionExpiresAt &&
      userInfo.subscriptionExpiresAt > now;

    // 如果订阅过期，更新数据库状态
    if (
      userInfo.isPaid &&
      (!userInfo.subscriptionExpiresAt || userInfo.subscriptionExpiresAt <= now)
    ) {
      await db
        .update(user)
        .set({
          isPaid: false,
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));

      return NextResponse.json({
        isPaid: false,
        subscriptionExpiresAt: null,
      });
    }

    return NextResponse.json({
      isPaid: isSubscriptionValid,
      subscriptionExpiresAt: userInfo.subscriptionExpiresAt,
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
