import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mockExamScores } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scores = await db
    .select()
    .from(mockExamScores)
    .where(eq(mockExamScores.userId, session.user.id))
    .orderBy(desc(mockExamScores.createdAt));

  return NextResponse.json(scores);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { score, totalQuestions, correctCount } = body;

  if (
    typeof score !== "number" ||
    typeof totalQuestions !== "number" ||
    typeof correctCount !== "number"
  ) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await db.insert(mockExamScores).values({
    userId: session.user.id,
    score,
    totalQuestions,
    correctCount,
  });

  return NextResponse.json({ success: true });
}
