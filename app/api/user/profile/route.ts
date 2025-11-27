import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!dbUser) {
    return new NextResponse("User not found", { status: 404 });
  }

  // Check if subscription is expired
  let isPaid = dbUser.isPaid;
  if (isPaid && dbUser.subscriptionExpiresAt) {
    if (new Date() > dbUser.subscriptionExpiresAt) {
      isPaid = false;
    }
  }

  return NextResponse.json({
    ...dbUser,
    isPaid,
  });
}
