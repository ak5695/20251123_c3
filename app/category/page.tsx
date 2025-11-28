"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { QuizView } from "@/components/quiz-view";
import { BookOpen, AlertTriangle, Star, Layers, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

function CategoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
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

  const [stats, setStats] = useState({
    unanswered: 0,
    mistakes: 0,
    collected: 0,
    unmemorized: 0,
  });

  useEffect(() => {
    // 获取该分类的统计数据
    fetch(`/api/category-stats?category=${encodeURIComponent(category)}`)
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, [category]);

  const cards = [
    {
      label: "未做题目",
      value: stats.unanswered,
      icon: BookOpen,
      color: "text-gray-600",
      filter: "unanswered",
    },
    {
      label: "做错题目",
      value: stats.mistakes,
      icon: AlertTriangle,
      color: "text-red-500",
      filter: "mistakes",
    },
    {
      label: "已收藏",
      value: stats.collected,
      icon: Star,
      color: "text-yellow-500",
      filter: "collection",
    },
    {
      label: "未浏览",
      value: stats.unmemorized,
      icon: Layers,
      color: "text-purple-500",
      filter: "unmemorized",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white rounded-xl p-2 shadow-sm mb-2 flex gap-2 justify-between">
        {cards.map((card) => (
          <Card
            key={card.label}
            className="flex-1 cursor-pointer hover:shadow-md transition-shadow p-2 flex flex-col items-center justify-center"
            onClick={() =>
              router.push(
                `/recite?category=${encodeURIComponent(category)}&filter=${
                  card.filter
                }`
              )
            }
          >
            <CardContent className="p-0 flex flex-col items-center">
              <card.icon className={`w-5 h-5 mb-1 ${card.color}`} />
              <div className="text-base font-bold">{card.value}</div>
              <div className="text-xs text-gray-500">{card.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <QuizView
        mode="recite"
        category={category}
        isPaid={userProfile?.isPaid}
      />
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
