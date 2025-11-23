"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";

interface Record {
  id: string;
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  createdAt: string;
  questionContent: string;
  questionType: string;
  correctAnswer: string;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await fetch("/api/records");
        const data = await res.json();
        setRecords(data);
      } catch (error) {
        console.error("Failed to fetch records", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-medium ml-2">做题记录</h1>
      </header>

      <main className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无做题记录</div>
        ) : (
          records.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={record.isCorrect ? "default" : "destructive"}
                      className={
                        record.isCorrect
                          ? "bg-green-500 hover:bg-green-600"
                          : ""
                      }
                    >
                      {record.isCorrect ? "正确" : "错误"}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {format(new Date(record.createdAt), "yyyy-MM-dd HH:mm")}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium mb-3 line-clamp-2">
                  {record.questionContent}
                </p>
                <div className="text-xs text-gray-500 flex gap-4">
                  <span>
                    你的答案:{" "}
                    <span
                      className={
                        record.isCorrect ? "text-green-600" : "text-red-600"
                      }
                    >
                      {record.userAnswer}
                    </span>
                  </span>
                  {!record.isCorrect && (
                    <span>
                      正确答案:{" "}
                      <span className="text-green-600">
                        {record.correctAnswer}
                      </span>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
