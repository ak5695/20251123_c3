import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 创建2个月后的过期时间
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 2);

    // 创建 Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "alipay", "wechat_pay"],
      line_items: [
        {
          price_data: {
            currency: "cny",
            product_data: {
              name: "C3安考宝典 - 两月会员",
              description: "2个月完整功能访问权限",
            },
            unit_amount: 1280, // 12.8元 = 1280分
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
      },
    });

    // 在数据库中记录订阅信息
    await db.insert(subscriptions).values({
      userId: session.user.id,
      stripeSessionId: checkoutSession.id,
      amount: 990,
      currency: "cny",
      status: "pending",
      expiresAt: expiresAt,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
