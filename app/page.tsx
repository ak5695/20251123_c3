"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Star,
  Eye,
  EyeOff,
  HelpCircle,
  LogOut,
  Loader2,
  FileText,
  BarChart,
  PenTool,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

interface CategoryStats {
  category: string;
  total: number;
  unanswered: number;
  correct: number;
  incorrect: number;
  collected: number;
  viewed: number;
  unviewed: number;
}

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const { data: stats = [], isLoading: isStatsLoading } = useQuery<
    CategoryStats[]
  >({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard-stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!session,
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const navigateToQuiz = (category: string, filterType: string) => {
    const params = new URLSearchParams();
    if (category !== "全部") {
      params.set("category", category);
    }
    params.set("filterType", filterType);
    router.push(`/quiz/category?${params.toString()}`);
  };

  if (isPending || (session && isStatsLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const allStats = stats.find((s) => s.category === "全部");
  const categoryStats = stats.filter((s) => s.category !== "全部");

  const StatButton = ({
    label,
    value,
    color,
    bgColor,
    onClick,
  }: {
    label: string;
    value: number;
    color: string;
    bgColor: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-1 rounded hover:bg-gray-50 transition-colors w-full ${bgColor} bg-opacity-20`}
    >
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-gray-500">{label}</span>
    </button>
  );

  const topActions = [
    {
      label: "模拟试卷",
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-100",
      href: "/quiz/mock",
    },
    {
      label: "模拟成绩",
      icon: BarChart,
      color: "text-purple-500",
      bg: "bg-purple-100",
      href: "/mock-scores",
    },
    {
      label: "我的笔记",
      icon: PenTool,
      color: "text-orange-500",
      bg: "bg-orange-100",
      href: "/notes",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-3 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.jpg" // 确保路径正确，public目录下的文件需要以/开头
            alt="网站logo" // 添加alt属性提高可访问性
            width={40} // size-5对应20px
            height={40} // size-5对应20px
            className="size-10 object-contain" // 添加object-contain确保图片正确显示
            priority={false} // 非关键图片设置为false
          />
          <h1 className="text-lg font-bold">广东C3安考宝典</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">
            {session.user.name || session.user.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-gray-500 h-8 w-8"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="p-2 space-y-2 max-w-md mx-auto">
        {/* Top Actions */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {topActions.map((action) => (
            <Card
              key={action.label}
              className="cursor-pointer hover:shadow-md transition-shadow border-none shadow-sm py-2"
              onClick={() => router.push(action.href)}
            >
              <CardContent className="flex flex-col items-center justify-center p-0 gap-2">
                <div className={`p-2 rounded-full ${action.bg}`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {action.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Total Stats Card */}
        {allStats && (
          <Card className="border-none shadow-sm overflow-hidden gap-y-0 p-1 rounded-sm">
            <CardHeader className=" py-0 px-3">
              <CardTitle className="flex justify-between items-center text-sm">
                <span>总题库</span>
                <span className="text-xs text-gray-400 font-normal">
                  共 {allStats.total} 题
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-6 gap-1">
                <StatButton
                  label="未做"
                  value={allStats.unanswered}
                  color="text-gray-600"
                  bgColor="bg-gray-100"
                  onClick={() => navigateToQuiz("全部", "unanswered")}
                />
                <StatButton
                  label="做对"
                  value={allStats.correct}
                  color="text-green-600"
                  bgColor="bg-green-100"
                  onClick={() => navigateToQuiz("全部", "correct")}
                />
                <StatButton
                  label="做错"
                  value={allStats.incorrect}
                  color="text-red-600"
                  bgColor="bg-red-100"
                  onClick={() => navigateToQuiz("全部", "incorrect")}
                />
                <StatButton
                  label="收藏"
                  value={allStats.collected}
                  color="text-yellow-600"
                  bgColor="bg-yellow-100"
                  onClick={() => navigateToQuiz("全部", "collected")}
                />
                <StatButton
                  label="已浏览"
                  value={allStats.viewed}
                  color="text-blue-600"
                  bgColor="bg-blue-100"
                  onClick={() => navigateToQuiz("全部", "viewed")}
                />
                <StatButton
                  label="未浏览"
                  value={allStats.unviewed}
                  color="text-purple-600"
                  bgColor="bg-purple-100"
                  onClick={() => navigateToQuiz("全部", "unviewed")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Stats Cards */}
        <div className="space-y-1">
          {categoryStats.map((stat) => (
            <Card
              key={stat.category}
              className="border-none shadow-sm gap-y-0 p-1 rounded-sm"
            >
              <CardHeader className="pb-0 px-3 border-b border-gray-50">
                <CardTitle className="flex justify-between items-center text-sm  ">
                  <span>{stat.category}</span>
                  <span className="text-xs text-gray-400 font-normal">
                    共 {stat.total} 题
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-6 gap-1">
                  <StatButton
                    label="未做"
                    value={stat.unanswered}
                    color="text-gray-600"
                    bgColor="bg-gray-100"
                    onClick={() => navigateToQuiz(stat.category, "unanswered")}
                  />
                  <StatButton
                    label="做对"
                    value={stat.correct}
                    color="text-green-600"
                    bgColor="bg-green-100"
                    onClick={() => navigateToQuiz(stat.category, "correct")}
                  />
                  <StatButton
                    label="做错"
                    value={stat.incorrect}
                    color="text-red-600"
                    bgColor="bg-red-100"
                    onClick={() => navigateToQuiz(stat.category, "incorrect")}
                  />
                  <StatButton
                    label="收藏"
                    value={stat.collected}
                    color="text-yellow-600"
                    bgColor="bg-yellow-100"
                    onClick={() => navigateToQuiz(stat.category, "collected")}
                  />
                  <StatButton
                    label="已浏览"
                    value={stat.viewed}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                    onClick={() => navigateToQuiz(stat.category, "viewed")}
                  />
                  <StatButton
                    label="未浏览"
                    value={stat.unviewed}
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                    onClick={() => navigateToQuiz(stat.category, "unviewed")}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <footer className="mt-12 py-8 text-center text-xs text-muted-foreground/60 border-t">
          <div className="flex justify-center gap-4 mb-4">
            <a
              href="/refund"
              className="hover:text-foreground transition-colors"
            >
              退款政策
            </a>
            <span className="text-border">|</span>
            <a
              href="/contact"
              className="hover:text-foreground transition-colors"
            >
              联系方式
            </a>
            <span className="text-border">|</span>
            <a
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              隐私政策
            </a>
          </div>
          <div className="space-y-2 px-4 leading-relaxed max-w-3xl mx-auto">
            <p>
              题库来源：
              广东省住房和城乡建设厅官方网站2025年8月8日公开发布的《广东省建筑施工企业综合类专职安全生产管理人员（C3类）安全生产考核第六批题库及参考答案》(2965道)
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
