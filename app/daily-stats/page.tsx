"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Star,
  Eye,
  Loader2,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface DailyStats {
  date: string;
  correct: number;
  incorrect: number;
  collected: number;
  viewed: number;
}

interface StatsData {
  totals: {
    correct: number;
    incorrect: number;
    collected: number;
    viewed: number;
  };
  dailyStats: DailyStats[];
}

export default function DailyStatsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.push("/sign-in");
      return;
    }

    async function fetchStats() {
      try {
        const res = await fetch("/api/daily-stats");
        if (res.status === 403) {
          setError("此功能仅限会员使用");
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch daily stats:", err);
        setError("加载失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [session, isPending, router]);

  if (isPending || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="font-medium ml-2">每日统计</h1>
        </header>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "M月d日 EEEE", { locale: zhCN });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "yyyy年M月d日", { locale: zhCN });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-medium ml-2">每日统计</h1>
      </header>

      <main className="p-4 space-y-4">
        {/* Total Stats Card */}
        {stats && (
          <Card className="border-none shadow-md p-1 gap-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 px-0" />
                累计统计
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <CheckCircle className="w-4 h-4 text-green-300" />
                  </div>
                  <div className="text-2xl font-bold">
                    {stats.totals.correct}
                  </div>
                  <div className="text-xs text-white/70">做对</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <XCircle className="w-4 h-4 text-red-300" />
                  </div>
                  <div className="text-2xl font-bold">
                    {stats.totals.incorrect}
                  </div>
                  <div className="text-xs text-white/70">做错</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Star className="w-4 h-4 text-yellow-300" />
                  </div>
                  <div className="text-2xl font-bold">
                    {stats.totals.collected}
                  </div>
                  <div className="text-xs text-white/70">收藏</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Eye className="w-4 h-4 text-blue-300" />
                  </div>
                  <div className="text-2xl font-bold">
                    {stats.totals.viewed}
                  </div>
                  <div className="text-xs text-white/70">已浏览</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Stats List */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-600 px-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            每日记录
          </h2>

          {stats?.dailyStats.length === 0 ? (
            <Card className="border-none shadow-sm py-1">
              <CardContent className="py-1 text-center text-gray-500">
                暂无学习记录
              </CardContent>
            </Card>
          ) : (
            stats?.dailyStats.map((day) => (
              <Card key={day.date} className="border-none shadow-sm py-1">
                <CardContent className="py-1">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-sm">
                         {formatFullDate(day.date)}
                      </div>
        
                    </div>
                    <div className="text-xs text-gray-400">
                      共 {day.correct + day.incorrect} 题
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className=" flex items-center justify-center gap-1.5 bg-green-50 rounded-lg p-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="text-sm font-bold text-green-600">
                          {day.correct}
                        </div>
                        <div className="text-[10px] text-green-500/70">
                          做对
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 bg-red-50 rounded-lg p-1">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <div>
                        <div className="text-sm font-bold text-red-600">
                          {day.incorrect}
                        </div>
                        <div className="text-[10px] text-red-500/70">做错</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 bg-yellow-50 rounded-lg p-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <div>
                        <div className="text-sm font-bold text-yellow-600">
                          {day.collected}
                        </div>
                        <div className="text-[10px] text-yellow-500/70">
                          收藏
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center  gap-1.5 bg-blue-50 rounded-lg p-1">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="text-sm font-bold text-blue-600">
                          {day.viewed}
                        </div>
                        <div className="text-[10px] text-blue-500/70">浏览</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
