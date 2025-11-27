"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: number;
  content: string;
  type: string;
  options: string;
  answer: string;
  explanation: string;
  mnemonic: string | null;
  category: string | null;
  note: string;
  updatedAt: string;
}

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error("Failed to fetch notes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent card click
    if (deletingId) return;

    setDeletingId(id);
    try {
      await fetch("/api/note", {
        method: "POST",
        body: JSON.stringify({
          questionId: id,
          note: null,
        }),
      });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("笔记已删除");
    } catch (error) {
      toast.error("删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold">我的笔记 ({notes.length})</h1>
      </header>

      <main className="p-4 space-y-4">
        {notes.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            暂无笔记，快去练习中添加吧
          </div>
        ) : (
          notes.map((item, index) => (
            <Card
              key={item.id}
              className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                deletingId === item.id ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={() => router.push(`/quiz/notes?offset=${index}`)}
            >
              <CardHeader className="bg-gray-50 p-4 border-b">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                        {item.type === "SINGLE"
                          ? "单选"
                          : item.type === "MULTIPLE"
                          ? "多选"
                          : "判断"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.category || "综合"}
                      </span>
                    </div>
                    <CardTitle className="text-base font-medium line-clamp-2">
                      {item.content}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500 shrink-0"
                    onClick={(e) => handleDeleteNote(e, item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                  <div className="text-xs text-yellow-600 font-bold mb-1">
                    我的笔记
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {item.note}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  <div className="font-medium mb-1">答案解析：</div>
                  <div className="mb-1">
                    正确答案：
                    <span className="text-green-600 font-bold">
                      {item.answer}
                    </span>
                  </div>
                  <div className="line-clamp-3">{item.explanation}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
