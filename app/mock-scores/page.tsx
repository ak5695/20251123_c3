"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface MockScore {
  id: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  answeredCount: number;
  createdAt: string;
}

export default function MockScoresPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!session,
  });

  useEffect(() => {
    if (userProfile && !userProfile.isPaid) {
      toast.error("请先开通会员");
      router.push("/");
    }
  }, [userProfile, router]);

  const { data: scores, isLoading: loading } = useQuery({
    queryKey: ["mock-scores", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/mock-scores");
      if (!res.ok) throw new Error("Failed to fetch scores");
      return res.json() as Promise<MockScore[]>;
    },
    enabled: !!session,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mr-2"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold">模拟成绩</h1>
      </header>

      <main className="p-4 space-y-4">
        {!scores || scores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无模拟考试记录</div>
        ) : (
          scores.map((score) => {
            // Handle backward compatibility for old records where answeredCount might be 0
            const answeredCount =
              score.answeredCount > 0
                ? score.answeredCount
                : score.totalQuestions;
            const incorrectCount = answeredCount - score.correctCount;
            const unansweredCount = score.totalQuestions - answeredCount;
            const accuracy =
              answeredCount > 0
                ? Math.round((score.correctCount / answeredCount) * 100)
                : 0;

            return (
              <Card key={score.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium">
                      {format(new Date(score.createdAt), "yyyy-MM-dd HH:mm")}
                    </CardTitle>
                    <div className="flex items-center text-orange-500">
                      <Trophy className="w-4 h-4 mr-1" />
                      <span className="font-bold text-lg">{score.score}分</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600">
                    <div className="flex justify-between pr-4">
                      <span>做对:</span>
                      <span className="font-medium text-green-600">
                        {score.correctCount}题
                      </span>
                    </div>
                    <div className="flex justify-between pl-4 border-l">
                      <span>做错:</span>
                      <span className="font-medium text-red-600">
                        {incorrectCount}题
                      </span>
                    </div>
                    <div className="flex justify-between pr-4">
                      <span>未做:</span>
                      <span className="font-medium text-gray-500">
                        {unansweredCount}题
                      </span>
                    </div>
                    <div className="flex justify-between pl-4 border-l">
                      <span>正确率:</span>
                      <span className="font-bold text-blue-600">
                        {accuracy}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
