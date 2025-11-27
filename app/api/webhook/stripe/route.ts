import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { subscriptions, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId || !session.id) {
          console.error("Missing userId or session id in webhook");
          return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        // 更新订阅状态为已完成
        await db
          .update(subscriptions)
          .set({
            status: "completed",
            stripePaymentIntentId: session.payment_intent as string,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSessionId, session.id));

        // 获取订阅信息以获取过期时间
        const subscription = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSessionId, session.id))
          .limit(1);

        if (subscription.length > 0) {
          // 更新用户付费状态
          await db
            .update(user)
            .set({
              isPaid: true,
              subscriptionExpiresAt: subscription[0].expiresAt,
              stripeCustomerId: session.customer as string,
              updatedAt: new Date(),
            })
            .where(eq(user.id, userId));
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.id) {
          // 更新订阅状态为过期
          await db
            .update(subscriptions)
            .set({
              status: "expired",
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSessionId, session.id));
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
