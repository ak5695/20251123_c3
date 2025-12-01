"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trash2, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MyComment {
  id: string;
  questionId: number;
  content: string;
  createdAt: string;
  questionContent: string;
  questionType: string;
  questionOptions: string;
  questionAnswer: string;
  questionCategory: string | null;
}

// 解析选项并获取答案文本
const getAnswerText = (optionsStr: string, answer: string) => {
  try {
    const options = JSON.parse(optionsStr);
    const answerLabels = answer.split("");
    const answerTexts = answerLabels.map((label: string) => {
      const opt = options.find((o: any) => o.label === label);
      return opt ? `${label}. ${opt.value}` : label;
    });
    return answerTexts.join("；");
  } catch {
    return answer;
  }
};

export default function MyCommentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const { data: comments = [], isLoading: loading } = useQuery({
    queryKey: ["my-comments", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/my-comments");
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json() as Promise<MyComment[]>;
    },
    enabled: !!session,
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteComment = async (id: string) => {
    if (deletingId) return;

    setDeletingId(id);
    setDeleteConfirmId(null);
    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId: id }),
      });

      if (!res.ok) throw new Error("删除失败");

      queryClient.invalidateQueries({ queryKey: ["my-comments"] });
      toast.success("评论已删除");
    } catch (error) {
      toast.error("删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">加载中...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          我的评论 ({comments.length})
        </h1>
      </header>

      <main className="p-4 space-y-3">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            暂无评论，快去练习中发表吧
          </div>
        ) : (
          comments.map((item, index) => (
            <Card
              key={item.id}
              className={`p-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] gap-0 ${
                deletingId === item.id ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={() =>
                router.push(`/quiz/category?questionId=${item.questionId}`)
              }
            >
              <div className="flex gap-3">
                {/* 左侧序号和类型 */}
                <div className="flex flex-col items-center min-w-8">
                  <span className="text-gray-500 mb-1">{index + 1}.</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.questionType === "SINGLE"
                        ? "bg-blue-100 text-blue-600"
                        : item.questionType === "MULTIPLE"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {item.questionType === "SINGLE"
                      ? "单选"
                      : item.questionType === "MULTIPLE"
                      ? "多选"
                      : "判断"}
                  </span>
                </div>

                {/* 右侧内容 */}
                <div className="flex-1 min-w-0">
                  {/* 题目内容 */}
                  <div className="mb-2 font-medium text-gray-800">
                    {item.questionContent}
                  </div>

                  {/* 答案显示 */}
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">答案: </span>
                    {getAnswerText(item.questionOptions, item.questionAnswer)}
                  </div>

                  {/* 我的评论 - 蓝色高亮显示 */}
                  <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mb-1">
                      <MessageSquare className="w-3 h-3" />
                      我的评论
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                      {item.content}
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部操作区 */}
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-500 h-7 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(item.id);
                  }}
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3 mr-1" />
                      <span className="text-xs">删除</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))
        )}
      </main>

      {/* 删除确认弹窗 */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条评论吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() =>
                deleteConfirmId && handleDeleteComment(deleteConfirmId)
              }
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
