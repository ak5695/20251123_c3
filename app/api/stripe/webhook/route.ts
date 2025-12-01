import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { user, subscriptions, referralRewards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia" as any,
  typescript: true,
  httpClient: Stripe.createFetchHttpClient(),
});

// 给用户增加会员天数
async function addMembershipDays(userId: string, days: number) {
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!currentUser) return;

  let newExpiresAt: Date;
  if (
    currentUser.subscriptionExpiresAt &&
    new Date() < currentUser.subscriptionExpiresAt
  ) {
    // 如果当前会员未过期，在现有基础上增加
    newExpiresAt = new Date(currentUser.subscriptionExpiresAt);
  } else {
    // 如果已过期或从未购买，从现在开始计算
    newExpiresAt = new Date();
  }
  newExpiresAt.setDate(newExpiresAt.getDate() + days);

  await db
    .update(user)
    .set({
      isPaid: true,
      subscriptionExpiresAt: newExpiresAt,
    })
    .where(eq(user.id, userId));

  console.log(
    `[Referral] Added ${days} days to user ${userId}, new expiry: ${newExpiresAt}`
  );
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 });
    }

    const userId = session.metadata.userId;

    // Calculate expiration date (2 months from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 2);

    // 检查用户是否有推荐人，且是首次付费
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    const isFirstPayment = !currentUser?.isPaid;

    // Update user status
    await db
      .update(user)
      .set({
        isPaid: true,
        subscriptionExpiresAt: expiresAt,
        stripeCustomerId: session.customer as string,
      })
      .where(eq(user.id, userId));

    // Create subscription record
    await db.insert(subscriptions).values({
      userId: userId,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      amount: session.amount_total || 0,
      currency: session.currency || "cny",
      status: "completed",
      expiresAt: expiresAt,
    });

    // 处理推荐奖励（仅首次付费时）
    if (isFirstPayment && currentUser?.referredBy) {
      console.log(
        `[Referral] Processing referral reward for user ${userId}, referred by ${currentUser.referredBy}`
      );

      // 查找推荐奖励记录
      const rewardRecord = await db.query.referralRewards.findFirst({
        where: and(
          eq(referralRewards.referrerId, currentUser.referredBy),
          eq(referralRewards.refereeId, userId)
        ),
      });

      if (
        rewardRecord &&
        !rewardRecord.referrerRewarded &&
        !rewardRecord.refereeRewarded
      ) {
        // 给推荐人增加5天会员
        await addMembershipDays(currentUser.referredBy, 5);

        // 给被推荐人（当前用户）增加5天会员
        await addMembershipDays(userId, 5);

        // 更新奖励记录
        await db
          .update(referralRewards)
          .set({
            referrerRewarded: true,
            refereeRewarded: true,
          })
          .where(eq(referralRewards.id, rewardRecord.id));

        console.log(
          `[Referral] Reward distributed: referrer ${currentUser.referredBy} and referee ${userId} each got 5 days`
        );
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
