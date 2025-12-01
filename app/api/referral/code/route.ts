import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// 生成6位推荐码
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 排除容易混淆的字符 0OI1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 获取用户信息
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 如果用户还没有推荐码，生成一个
    let referralCode = currentUser.referralCode;
    if (!referralCode) {
      // 生成唯一的推荐码
      let attempts = 0;
      while (attempts < 10) {
        const newCode = generateReferralCode();
        const existing = await db.query.user.findFirst({
          where: eq(user.referralCode, newCode),
        });
        if (!existing) {
          referralCode = newCode;
          break;
        }
        attempts++;
      }

      if (!referralCode) {
        // 如果10次都生成了重复的，使用用户ID的一部分
        referralCode = session.user.id.substring(0, 6).toUpperCase();
      }

      // 保存推荐码
      await db
        .update(user)
        .set({ referralCode })
        .where(eq(user.id, session.user.id));
    }

    return NextResponse.json({
      referralCode,
      referralLink: `${
        process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://c3.dufran.cn"
      }/sign-up?ref=${referralCode}`,
    });
  } catch (error) {
    console.error("Error getting referral code:", error);
    return NextResponse.json(
      { error: "Failed to get referral code" },
      { status: 500 }
    );
  }
}
