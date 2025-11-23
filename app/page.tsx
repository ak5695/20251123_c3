"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  FileText,
  History,
  MessageSquare,
  PenTool,
  Star,
  AlertTriangle,
} from "lucide-react";

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-up");
    }
  }, [session, isPending, router]);

  if (isPending)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
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
      label: "反馈纠错",
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-100",
      href: "/feedback",
    },
  ];

  const modes = [
    { label: "章节练习", icon: BookOpen, href: "/quiz/chapter" },
    { label: "模拟试卷", icon: FileText, href: "/quiz/mock" },
    { label: "试题收藏", icon: Star, href: "/quiz/collection" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-lg font-bold text-center">安考宝典</h1>
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

        {/* Modes */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500">智能题库</h2>
          <div className="grid gap-4">
            {modes.map((mode) => (
              <Card
                key={mode.label}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(mode.href)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <mode.icon className="w-6 h-6 text-orange-500" />
                    </div>
                    <span className="font-medium">{mode.label}</span>
                  </div>
                  <div className="text-gray-300">›</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
