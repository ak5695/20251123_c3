import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, userQuestionState } from "@/lib/db/schema";
import { eq, sql, and, gt, isNotNull, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = parseInt(searchParams.get("offset") || "0");
  const filterPracticed = searchParams.get("filterPracticed") === "true";
  const random = searchParams.get("random") === "true";
  const filterType = searchParams.get("filterType");

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
          image: questions.image,
          isCollected: userQuestionState.isCollected,
          isRecited: userQuestionState.isRecited,
          note: userQuestionState.note,
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
          image: questions.image,
          isCollected: userQuestionState.isCollected,
          isRecited: userQuestionState.isRecited,
          note: userQuestionState.note,
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
          image: questions.image,
          isCollected: userQuestionState.isCollected,
          isRecited: userQuestionState.isRecited,
          note: userQuestionState.note,
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

    const data = [...single, ...multiple, ...judge];
    return NextResponse.json({ data, total: data.length });
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
      image: questions.image,
      isCollected: userQuestionState.isCollected,
      isRecited: userQuestionState.isRecited,
      note: userQuestionState.note,
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
  } else if (mode === "notes") {
    // @ts-ignore
    query = query.where(and(isNotNull(userQuestionState.note)));

    // Count total for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .leftJoin(
        userQuestionState,
        and(
          eq(questions.id, userQuestionState.questionId),
          session ? eq(userQuestionState.userId, session.user.id) : sql`FALSE`
        )
      )
      .where(and(isNotNull(userQuestionState.note)));

    const [{ count }] = await countQuery;

    // @ts-ignore
    query = query.orderBy(desc(userQuestionState.updatedAt));
    // @ts-ignore
    query = query.limit(limit).offset(offset);

    const data = await query;
    return NextResponse.json({ data, total: count });
  } else {
    const conditions = [];
    if (category) {
      conditions.push(sql`${questions.category} LIKE ${`%${category}%`}`);
    }

    if (filterPracticed) {
      conditions.push(
        sql`COALESCE(${userQuestionState.correctCount}, 0) = 0 AND COALESCE(${userQuestionState.wrongCount}, 0) = 0`
      );
    }

    if (filterType) {
      switch (filterType) {
        case "unanswered":
          conditions.push(
            sql`(${userQuestionState.id} IS NULL OR (COALESCE(${userQuestionState.correctCount}, 0) = 0 AND COALESCE(${userQuestionState.wrongCount}, 0) = 0))`
          );
          break;
        case "correct":
          conditions.push(
            sql`${userQuestionState.correctCount} > 0 AND COALESCE(${userQuestionState.wrongCount}, 0) = 0`
          );
          break;
        case "incorrect":
          conditions.push(sql`${userQuestionState.wrongCount} > 0`);
          break;
        case "collected":
          conditions.push(sql`${userQuestionState.isCollected} = true`);
          break;
        case "viewed":
          conditions.push(sql`${userQuestionState.isRecited} = true`);
          break;
        case "unviewed":
          conditions.push(
            sql`(${userQuestionState.isRecited} IS NULL OR ${userQuestionState.isRecited} = false)`
          );
          break;
      }
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(...conditions));
    }

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .leftJoin(
        userQuestionState,
        and(
          eq(questions.id, userQuestionState.questionId),
          session ? eq(userQuestionState.userId, session.user.id) : sql`FALSE`
        )
      );

    if (conditions.length > 0) {
      // @ts-ignore
      countQuery.where(and(...conditions));
    }

    const [{ count }] = await countQuery;

    let pageTypes: string[] = [];
    if (!random) {
      // Fetch all types to determine page categories
      let typeQuery = db
        .select({ type: questions.type })
        .from(questions)
        .leftJoin(
          userQuestionState,
          and(
            eq(questions.id, userQuestionState.questionId),
            session ? eq(userQuestionState.userId, session.user.id) : sql`FALSE`
          )
        );

      if (conditions.length > 0) {
        // @ts-ignore
        typeQuery.where(and(...conditions));
      }

      // @ts-ignore
      typeQuery.orderBy(questions.id);

      const allTypes = await typeQuery;

      // Sample types for each page
      for (let i = 0; i < allTypes.length; i += limit) {
        pageTypes.push(allTypes[i].type);
      }
    }

    if (random) {
      // @ts-ignore
      query = query.orderBy(sql`RANDOM()`);
    } else {
      // @ts-ignore
      query = query.orderBy(questions.id);
    }

    query = query.limit(limit).offset(offset) as any;
    const data = await query;
    return NextResponse.json({ data, total: count, pageTypes });
  }

  const data = await query;
  return NextResponse.json({ data, total: data.length });
}
