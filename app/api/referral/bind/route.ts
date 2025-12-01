import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, referralRewards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { referralCode } = await req.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: "Referral code required" },
        { status: 400 }
      );
    }

    // 查找当前用户
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 检查是否已经有推荐人
    if (currentUser.referredBy) {
      return NextResponse.json(
        { error: "Already has a referrer" },
        { status: 400 }
      );
    }

    // 查找推荐人
    const referrer = await db.query.user.findFirst({
      where: eq(user.referralCode, referralCode.toUpperCase()),
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 400 }
      );
    }

    // 不能推荐自己
    if (referrer.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot refer yourself" },
        { status: 400 }
      );
    }

    // 更新当前用户的推荐人
    await db
      .update(user)
      .set({ referredBy: referrer.id })
      .where(eq(user.id, session.user.id));

    // 创建推荐奖励记录（待付费后激活）
    await db.insert(referralRewards).values({
      referrerId: referrer.id,
      refereeId: session.user.id,
      rewardDays: 5,
      referrerRewarded: false,
      refereeRewarded: false,
    });

    return NextResponse.json({
      success: true,
      message: "Referral binding successful",
    });
  } catch (error) {
    console.error("Error binding referral:", error);
    return NextResponse.json(
      { error: "Failed to bind referral" },
      { status: 500 }
    );
  }
}
