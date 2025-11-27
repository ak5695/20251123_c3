import { QuizView } from "@/components/quiz-view";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { mode } = await params;
  const { category, filterType } = await searchParams;

  const categoryStr = Array.isArray(category) ? category[0] : category;
  const filterTypeStr = Array.isArray(filterType) ? filterType[0] : filterType;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let isPaid = false;
  if (session) {
    const dbUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });
    isPaid = dbUser?.isPaid || false;

    // Check if subscription is expired
    if (isPaid && dbUser?.subscriptionExpiresAt) {
      if (new Date() > dbUser.subscriptionExpiresAt) {
        isPaid = false;
      }
    }
  }

  return (
    <QuizView
      key={`${mode}-${categoryStr || "all"}-${filterTypeStr || "all"}`}
      mode={mode}
      category={categoryStr as string}
      filterType={filterTypeStr as string}
      isPaid={isPaid}
    />
  );
}
