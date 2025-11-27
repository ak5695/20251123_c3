"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { QuizView } from "@/components/quiz-view";

export default function RecitePage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || undefined;

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  if (isPending)
    return (
      <div className="flex h-screen items-center justify-center">加载中...</div>
    );
  if (!session) return null;

  return <QuizView mode="recite" category={category} />;
}
