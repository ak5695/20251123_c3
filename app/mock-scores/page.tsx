"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface MockScore {
  id: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  createdAt: string;
}

export default function MockScoresPage() {
  const router = useRouter();
  const [scores, setScores] = useState<MockScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mock-scores")
      .then((res) => res.json())
      .then((data) => {
        setScores(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

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
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : scores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无模拟考试记录</div>
        ) : (
          scores.map((score) => (
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
                <div className="flex justify-between text-sm text-gray-500">
                  <span>总题数: {score.totalQuestions}</span>
                  <span>答对: {score.correctCount}</span>
                  <span>
                    正确率:{" "}
                    {Math.round(
                      (score.correctCount / score.totalQuestions) * 100
                    )}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
