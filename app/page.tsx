"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  FileText,
  History,
  MessageSquare,
  PenTool,
  Star,
  AlertTriangle,
  BarChart,
} from "lucide-react";

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const [stats, setStats] = useState<
    { category: string; total: number; answered: number }[]
  >([]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-up");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch(console.error);
    }
  }, [session]);

  if (isPending)
    return (
      <div className="flex h-screen items-center justify-center">加载中...</div>
    );
  if (!session) return null;

  const mainActions = [
    {
      label: "做题记录",
      icon: History,
      color: "text-orange-500",
      bg: "bg-orange-100",
      href: "/records",
    },
    {
      label: "错题强化",
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-100",
      href: "/quiz/mistakes",
    },
    {
      label: "我的笔记",
      icon: PenTool,
      color: "text-orange-500",
      bg: "bg-orange-100",
      href: "/notes",
    },
    {
      label: "模拟成绩",
      icon: BarChart,
      color: "text-blue-500",
      bg: "bg-blue-100",
      href: "/mock-scores",
    },
  ];

  const modes = [
    { label: "模拟试卷", icon: FileText, href: "/quiz/mock" },
    { label: "试题收藏", icon: Star, href: "/quiz/collection" },
  ];

  const categories = [
    { label: "法律法规", color: "text-blue-500", bg: "bg-blue-50" },
    { label: "安全管理", color: "text-green-500", bg: "bg-green-50" },
    { label: "土建综合安全技术", color: "text-purple-500", bg: "bg-purple-50" },
    { label: "机械设备安全技术", color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-lg font-bold text-center">C3安考宝典</h1>
      </header>

      <main className="p-4 space-y-6">
        {/* Main Actions */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 mb-4">做题报告</h2>
          <div className="grid grid-cols-4 gap-2">
            {mainActions.map((action) => (
              <div
                key={action.label}
                className="flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => router.push(action.href)}
              >
                <div className={`p-3 rounded-xl ${action.bg}`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <span className="text-xs text-gray-600">{action.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500">专项练习</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const stat = stats.find((s) => s.category === category.label);
              return (
                <Card
                  key={category.label}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    router.push(
                      `/quiz/category?category=${encodeURIComponent(
                        category.label
                      )}`
                    )
                  }
                >
                  <CardContent className="flex flex-col p-4 gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.bg} shrink-0`}>
                        <BookOpen className={`w-5 h-5 ${category.color}`} />
                      </div>
                      <span className="font-medium text-sm">
                        {category.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 pl-1">
                      {stat ? `${stat.answered}/${stat.total}` : "加载中..."}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Other Modes */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500">常用功能</h2>
          <div className="grid grid-cols-2 gap-3">
            {modes.map((mode) => (
              <Card
                key={mode.label}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(mode.href)}
              >
                <CardContent className="flex items-center p-4 gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                    <mode.icon className="w-5 h-5 text-gray-500" />
                  </div>
                  <span className="font-medium text-sm">{mode.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
