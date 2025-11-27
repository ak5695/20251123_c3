import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia" as any,
  typescript: true,
  httpClient: Stripe.createFetchHttpClient(),
});

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
    // Since we don't have the webhook secret set up in env yet, we might want to skip signature verification for testing if needed,
    // but for security we should enforce it.
    // However, for this specific request, I will allow it to proceed if no secret is set, assuming dev environment.
    // BUT, constructEvent throws if secret is missing or invalid.
    // For now, let's assume the user will set STRIPE_WEBHOOK_SECRET.
    // If not, we can't verify.

    // For the sake of this task, if verification fails, we return 400.
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 });
    }

    // Calculate expiration date (2 months from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 2);

    await db
      .update(user)
      .set({
        isPaid: true,
        subscriptionExpiresAt: expiresAt,
        stripeCustomerId: session.customer as string,
      })
      .where(eq(user.id, session.metadata.userId));
  }

  return new NextResponse(null, { status: 200 });
}
