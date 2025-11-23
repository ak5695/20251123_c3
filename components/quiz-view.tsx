"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid,
  Settings,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Question {
  id: number;
  type: "SINGLE" | "MULTIPLE" | "JUDGE";
  content: string;
  options: string; // JSON string
  answer: string;
  explanation: string;
  mnemonic: string | null;
  isCollected: boolean;
}

interface QuizViewProps {
  mode: string;
}

export function QuizView({ mode }: QuizViewProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const [results, setResults] = useState<{ id: number; isCorrect: boolean }[]>(
    []
  );
  // Track answered questions to show status in sheet
  const [answeredQuestions, setAnsweredQuestions] = useState<
    Record<number, boolean>
  >({});

  // Touch handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(
    null
  );
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe) {
        handleNext();
      }
      if (isRightSwipe) {
        handlePrev();
      }
    }
  };

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/questions?mode=${mode}&limit=50`);
        const data = await res.json();
        setQuestions(data);
      } catch (error) {
        toast.error("Failed to load questions");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [mode]);

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (value: string) => {
    if (isSubmitted) return;

    if (currentQuestion.type === "MULTIPLE") {
      setSelectedAnswers((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value].sort()
      );
    } else {
      setSelectedAnswers([value]);
    }
  };

  const handleCollect = async () => {
    const newStatus = !currentQuestion.isCollected;
    // Optimistic update
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex].isCollected = newStatus;
    setQuestions(updatedQuestions);

    try {
      await fetch("/api/collect", {
        method: "POST",
        body: JSON.stringify({
          questionId: currentQuestion.id,
          isCollected: newStatus,
        }),
      });
      toast.success(newStatus ? "Collected" : "Removed from collection");
    } catch (error) {
      toast.error("Failed to update collection");
      // Revert
      updatedQuestions[currentIndex].isCollected = !newStatus;
      setQuestions(updatedQuestions);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswers.length === 0) return;

    setIsSubmitted(true);
    setShowAnswer(true);

    const userAnswer = selectedAnswers.join("");
    const isCorrect = userAnswer === currentQuestion.answer;

    setResults((prev) => [...prev, { id: currentQuestion.id, isCorrect }]);
    setAnsweredQuestions((prev) => ({ ...prev, [currentIndex]: isCorrect }));

    try {
      await fetch("/api/submit", {
        method: "POST",
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userAnswer,
          isCorrect,
        }),
      });
    } catch (error) {
      console.error("Failed to submit answer");
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswers([]);
      setShowAnswer(false);
      setIsSubmitted(false);
    } else {
      setShowSummary(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswers([]); // Note: This resets state, ideally we should persist it
      setShowAnswer(false);
      setIsSubmitted(false);
    }
  };

  const jumpToQuestion = (index: number) => {
    setCurrentIndex(index);
    setIsSheetOpen(false);
    // Reset state for the new question if it hasn't been answered yet
    // In a real app, we should persist the state of each question
    if (!answeredQuestions.hasOwnProperty(index)) {
      setSelectedAnswers([]);
      setShowAnswer(false);
      setIsSubmitted(false);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Loading questions...</div>;
  if (questions.length === 0)
    return <div className="p-8 text-center">No questions found.</div>;

  if (showSummary) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const accuracy = Math.round((correctCount / results.length) * 100) || 0;

    return (
      <div className="flex flex-col h-screen bg-gray-50 p-4">
        <Card className="mb-4">
          <CardHeader className="text-center font-bold text-xl">
            测试结果
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-8 border-orange-500 flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">正确率</div>
                <div className="text-3xl font-bold text-orange-500">
                  {accuracy}%
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 w-full text-center">
              <div>
                <div className="text-gray-500">答对</div>
                <div className="text-green-500 font-bold text-xl">
                  {correctCount}
                </div>
              </div>
              <div>
                <div className="text-gray-500">答错</div>
                <div className="text-red-500 font-bold text-xl">
                  {results.length - correctCount}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button
          className="w-full mb-2"
          onClick={() => window.location.reload()}
        >
          重新练习
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.history.back()}
        >
          返回列表
        </Button>
      </div>
    );
  }

  const options = JSON.parse(currentQuestion.options);

  return (
    <div
      className="flex flex-col h-screen bg-gray-50"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-medium truncate max-w-[200px]">
          {mode === "mock"
            ? "模拟试卷"
            : mode === "mistakes"
            ? "错题强化"
            : mode === "collection"
            ? "试题收藏"
            : "章节练习"}{" "}
          ({currentIndex + 1}/{questions.length})
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleCollect}>
            <Star
              className={`w-6 h-6 ${
                currentQuestion.isCollected
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-400"
              }`}
            />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <span className="inline-block bg-orange-500 text-white text-xs px-2 py-1 rounded mr-2">
            {currentQuestion.type === "SINGLE"
              ? "单选题"
              : currentQuestion.type === "MULTIPLE"
              ? "多选题"
              : "判断题"}
          </span>
          <span className="text-lg font-medium">{currentQuestion.content}</span>
        </div>

        <div className="space-y-3">
          {options.map((opt: any) => {
            const isSelected = selectedAnswers.includes(opt.label);
            const isCorrect = currentQuestion.answer.includes(opt.label);

            let optionStyle = "border-gray-200";
            if (showAnswer) {
              if (isCorrect) optionStyle = "border-green-500 bg-green-50";
              else if (isSelected && !isCorrect)
                optionStyle = "border-red-500 bg-red-50";
            } else if (isSelected) {
              optionStyle = "border-orange-500 bg-orange-50";
            }

            return (
              <div
                key={opt.label}
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${optionStyle}`}
                onClick={() => handleOptionSelect(opt.label)}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 border ${
                    isSelected || (showAnswer && isCorrect)
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "border-gray-300 text-gray-500"
                  }`}
                >
                  {opt.label}
                </div>
                <span className="flex-1">{opt.value}</span>
              </div>
            );
          })}
        </div>

        {showAnswer && (
          <div className="mt-6 p-4 bg-gray-100 rounded-xl">
            <div className="font-bold mb-2">答案解析</div>
            <div className="mb-2">
              正确答案:{" "}
              <span className="text-green-600 font-bold">
                {currentQuestion.answer}
              </span>
            </div>
            <div className="text-gray-600 text-sm">
              {currentQuestion.explanation}
            </div>
            {currentQuestion.mnemonic && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="font-bold mb-1 text-orange-600">记忆技巧</div>
                <div className="text-gray-600 text-sm">
                  {currentQuestion.mnemonic}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white p-4 border-t flex justify-between items-center">
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="flex-col gap-1 h-auto py-2"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            <Eye className="w-5 h-5" />
            <span className="text-xs">答案</span>
          </Button>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="flex-col gap-1 h-auto py-2">
                <Grid className="w-5 h-5" />
                <span className="text-xs">答题卡</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
              <SheetHeader>
                <SheetTitle>答题卡</SheetTitle>
              </SheetHeader>
              <div className="mt-6 grid grid-cols-6 gap-4 overflow-y-auto max-h-[60vh] p-2">
                {questions.map((q, index) => {
                  const isAnswered = answeredQuestions.hasOwnProperty(index);
                  const isCorrect = answeredQuestions[index];
                  const isCurrent = currentIndex === index;

                  let bgClass = "bg-gray-100 text-gray-600";
                  if (isCurrent) {
                    bgClass = "bg-blue-500 text-white ring-2 ring-blue-300";
                  } else if (isAnswered) {
                    bgClass = isCorrect
                      ? "bg-green-100 text-green-600 border border-green-500"
                      : "bg-red-100 text-red-600 border border-red-500";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => jumpToQuestion(index)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${bgClass}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-4 justify-center text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300"></div>
                  未做
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-100 border border-green-500"></div>
                  正确
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-100 border border-red-500"></div>
                  错误
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>当前
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            上一题
          </Button>
          {isSubmitted || showAnswer ? (
            <Button
              onClick={handleNext}
              className="bg-orange-500 hover:bg-orange-600"
            >
              下一题
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={selectedAnswers.length === 0}
            >
              提交
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
