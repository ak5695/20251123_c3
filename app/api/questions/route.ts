import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, userQuestionState } from "@/lib/db/schema";
import { eq, sql, and, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session && (mode === "mistakes" || mode === "collection")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (mode === "mock") {
    const [single, multiple, judge] = await Promise.all([
      db
        .select({
          id: questions.id,
          type: questions.type,
          content: questions.content,
          options: questions.options,
          answer: questions.answer,
          explanation: questions.explanation,
          mnemonic: questions.mnemonic,
          category: questions.category,
          isCollected: userQuestionState.isCollected,
          isPracticed: sql<boolean>`COALESCE(${userQuestionState.correctCount}, 0) > 0 OR COALESCE(${userQuestionState.wrongCount}, 0) > 0`,
        })
        .from(questions)
        .leftJoin(
          userQuestionState,
          and(
            eq(questions.id, userQuestionState.questionId),
            session ? eq(userQuestionState.userId, session.user.id) : sql`FALSE`
          )
        )
        .where(eq(questions.type, "SINGLE"))
        .orderBy(sql`RANDOM()`)
        .limit(62),

      db
        .select({
          id: questions.id,
          type: questions.type,
          content: questions.content,
          options: questions.options,
          answer: questions.answer,
          explanation: questions.explanation,
          mnemonic: questions.mnemonic,
          category: questions.category,
          isCollected: userQuestionState.isCollected,
          isPracticed: sql<boolean>`COALESCE(${userQuestionState.correctCount}, 0) > 0 OR COALESCE(${userQuestionState.wrongCount}, 0) > 0`,
        })
        .from(questions)
        .leftJoin(
          userQuestionState,
          and(
            eq(questions.id, userQuestionState.questionId),
            session ? eq(userQuestionState.userId, session.user.id) : sql`FALSE`
          )
        )
        .where(eq(questions.type, "MULTIPLE"))
        .orderBy(sql`RANDOM()`)
        .limit(10),

      db
        .select({
          id: questions.id,
          type: questions.type,
          content: questions.content,
          options: questions.options,
          answer: questions.answer,
          explanation: questions.explanation,
          mnemonic: questions.mnemonic,
          category: questions.category,
          isCollected: userQuestionState.isCollected,
          isPracticed: sql<boolean>`COALESCE(${userQuestionState.correctCount}, 0) > 0 OR COALESCE(${userQuestionState.wrongCount}, 0) > 0`,
        })
        .from(questions)
        .leftJoin(
          userQuestionState,
          and(
            eq(questions.id, userQuestionState.questionId),
            session ? eq(userQuestionState.userId, session.user.id) : sql`FALSE`
          )
        )
        .where(eq(questions.type, "JUDGE"))
        .orderBy(sql`RANDOM()`)
        .limit(18),
    ]);

    return NextResponse.json([...single, ...multiple, ...judge]);
  }

  let query = db
    .select({
      id: questions.id,
      type: questions.type,
      content: questions.content,
      options: questions.options,
      answer: questions.answer,
      explanation: questions.explanation,
      mnemonic: questions.mnemonic,
      category: questions.category,
      isCollected: userQuestionState.isCollected,
      isPracticed: sql<boolean>`COALESCE(${userQuestionState.correctCount}, 0) > 0 OR COALESCE(${userQuestionState.wrongCount}, 0) > 0`,
    })
    .from(questions)
    .leftJoin(
      userQuestionState,
      and(
        eq(questions.id, userQuestionState.questionId),
        session ? eq(userQuestionState.userId, session.user.id) : sql`FALSE`
      )
    );

  if (mode === "mistakes") {
    // @ts-ignore
    query = query.where(and(gt(userQuestionState.wrongCount, 0)));
  } else if (mode === "collection") {
    // @ts-ignore
    query = query.where(and(eq(userQuestionState.isCollected, true)));
  } else {
    if (category) {
      query = query.where(
        sql`${questions.category} LIKE ${`%${category}%`}`
      ) as any;
    }

    query = query.limit(limit).offset(offset) as any;
  }

  const data = await query;
  return NextResponse.json(data);
}
