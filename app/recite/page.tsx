"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { QuizView } from "@/components/quiz-view";
import { useQuery } from "@tanstack/react-query";

function ReciteContent() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || undefined;

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!session,
  });

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

  return (
    <QuizView mode="recite" category={category} isPaid={userProfile?.isPaid} />
  );
}

export default function RecitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          加载中...
        </div>
      }
    >
      <ReciteContent />
    </Suspense>
  );
}
