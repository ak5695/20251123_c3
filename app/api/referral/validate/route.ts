import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ valid: false });
    }

    // 查找推荐码对应的用户
    const referrer = await db.query.user.findFirst({
      where: eq(user.referralCode, code.toUpperCase()),
    });

    if (!referrer) {
      return NextResponse.json({ valid: false });
    }

    // 检查推荐人是否是付费用户
    const isPaidUser =
      referrer.isPaid &&
      (!referrer.subscriptionExpiresAt ||
        new Date() < referrer.subscriptionExpiresAt);

    return NextResponse.json({
      valid: true,
      isPaidReferrer: isPaidUser,
      referrerName: referrer.name,
    });
  } catch (error) {
    console.error("Error validating referral code:", error);
    return NextResponse.json({ valid: false });
  }
}
