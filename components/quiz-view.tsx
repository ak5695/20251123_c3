"use client";

import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Grid,
  LayoutList,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Question {
  id: number;
  type: "SINGLE" | "MULTIPLE" | "JUDGE";
  content: string;
  options: string; // JSON string
  answer: string;
  explanation: string;
  mnemonic: string | null;
  category: string | null;
  isCollected: boolean;
  note: string | null;
  isPracticed?: boolean;
}

interface QuizViewProps {
  mode: string;
  category?: string;
}

export function QuizView({ mode, category }: QuizViewProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "list">(
    mode === "category" ? "list" : "card"
  );
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [showAllAnswers, setShowAllAnswers] = useState(mode === "category");
  const [totalCount, setTotalCount] = useState(0);
  const limit = 50;
  const skipFetchRef = useRef(false);
  const navigationRef = useRef<"start" | "end" | null>(null);

  const [isConfiguring, setIsConfiguring] = useState(false);
  const [quizConfig, setQuizConfig] = useState({
    count: "50",
    random: false,
  });
  const [quizParams, setQuizParams] = useState<{
    limit: number;
    random: boolean;
  } | null>(null);

  const [showSummary, setShowSummary] = useState(false);
  const [results, setResults] = useState<{ id: number; isCorrect: boolean }[]>(
    []
  );
  // Track answered questions to show status in sheet
  const [answeredQuestions, setAnsweredQuestions] = useState<
    Record<number, boolean>
  >({});

  const [allUserAnswers, setAllUserAnswers] = useState<
    Record<number, string[]>
  >({});
  const [mockScore, setMockScore] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");
  const [isSavingNote, setIsSavingNote] = useState(false);

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

  const getAnswerText = (optionsJson: string, answer: string) => {
    try {
      const options = JSON.parse(optionsJson);
      return options
        .filter((opt: any) => answer.includes(opt.label))
        .map((opt: any) => opt.value)
        .join("，");
    } catch (e) {
      return answer;
    }
  };

  useEffect(() => {
    async function fetchQuestions() {
      if (skipFetchRef.current) {
        skipFetchRef.current = false;
        return;
      }
      try {
        setLoading(true);
        let url = `/api/questions?mode=${mode}&offset=${offset}`;

        if (quizParams) {
          url += `&limit=${quizParams.limit}`;
          if (quizParams.random) url += `&random=true`;
        } else {
          url += `&limit=${limit}`;
        }

        if (category) {
          url += `&category=${encodeURIComponent(category)}`;
        }
        if (mode === "category" && viewMode === "card" && !quizParams) {
          url += `&filterPracticed=true`;
        }
        const res = await fetch(url);
        const { data, total } = await res.json();
        if (data.length < limit) {
          setHasMore(false);
        }
        setQuestions(data);
        setTotalCount(total);

        if (navigationRef.current === "end") {
          const newIndex = data.length - 1;
          setCurrentIndex(newIndex);
          if (viewMode === "list") setDetailIndex(newIndex);
        } else {
          setCurrentIndex(0);
          if (viewMode === "list" && detailIndex !== null) setDetailIndex(0);
        }
        navigationRef.current = null;

        setResults([]);
        setAnsweredQuestions({});
        setShowSummary(false);
      } catch (error) {
        toast.error("Failed to load questions");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [mode, category, offset, viewMode, quizParams]);

  // Reset state when changing questions
  useEffect(() => {
    const question = questions[currentIndex];
    setNote(question?.note || "");

    if (question?.isPracticed) {
      setShowAnswer(true);
      setIsSubmitted(true);
    } else {
      // Restore user answer if exists
      const savedAnswer = allUserAnswers[currentIndex];
      if (savedAnswer) {
        setSelectedAnswers(savedAnswer);
        // In mock mode, we don't show answer immediately unless submitted
        if (mode !== "mock") {
          // Logic for non-mock mode restoration if needed
        }
      } else {
        setSelectedAnswers([]);
      }

      if (mode !== "mock") {
        setShowAnswer(false);
        setIsSubmitted(false);
      }
    }
  }, [currentIndex, questions, allUserAnswers, mode]);

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (value: string) => {
    if (isSubmitted && mode !== "mock") return; // Allow changing answer in mock mode before submission

    let newAnswers: string[];
    if (currentQuestion.type === "MULTIPLE") {
      newAnswers = selectedAnswers.includes(value)
        ? selectedAnswers.filter((v) => v !== value)
        : [...selectedAnswers, value].sort();
    } else {
      newAnswers = [value];
    }

    setSelectedAnswers(newAnswers);
    setAllUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: newAnswers,
    }));
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

  const handleSaveNote = async () => {
    if (!currentQuestion) return;
    setIsSavingNote(true);
    try {
      await fetch("/api/note", {
        method: "POST",
        body: JSON.stringify({
          questionId: currentQuestion.id,
          note: note,
        }),
      });

      // Update local state
      const updatedQuestions = [...questions];
      updatedQuestions[currentIndex].note = note;
      setQuestions(updatedQuestions);

      toast.success("笔记已保存");
    } catch (error) {
      toast.error("保存笔记失败");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleMockSubmit = async () => {
    let score = 0;
    let correctCount = 0;
    const newResults: { id: number; isCorrect: boolean }[] = [];

    questions.forEach((q, index) => {
      const userAns = allUserAnswers[index] || [];
      const userAnsStr = userAns.join("");

      let points = 0;
      let isCorrect = false;

      if (q.type === "SINGLE" || q.type === "JUDGE") {
        if (userAnsStr === q.answer) {
          points = 1;
          isCorrect = true;
        }
      } else if (q.type === "MULTIPLE") {
        // Check if user answer is exactly correct
        if (userAnsStr === q.answer) {
          points = 2;
          isCorrect = true;
        } else if (userAns.length > 0) {
          // Check for partial credit: all selected options must be in the answer
          const isSubset = userAns.every((opt) => q.answer.includes(opt));
          if (isSubset) {
            points = 1;
          }
        }
      }

      if (isCorrect) correctCount++;
      score += points;
      newResults.push({ id: q.id, isCorrect });
    });

    setMockScore(score);
    setResults(newResults);
    setShowSummary(true);

    try {
      await fetch("/api/mock-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          totalQuestions: questions.length,
          correctCount,
        }),
      });
      toast.success("成绩已保存");
    } catch (error) {
      console.error("Failed to save score:", error);
      toast.error("保存成绩失败");
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
      // selectedAnswers will be updated by useEffect
      if (mode !== "mock") {
        setShowAnswer(false);
        setIsSubmitted(false);
      }
    } else {
      if (mode === "mock") {
        // Optional: Auto submit or show confirmation?
        // For now, let user click "Submit Exam" button manually or we can show summary
      } else {
        setShowSummary(true);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      // selectedAnswers will be updated by useEffect
      if (mode !== "mock") {
        setShowAnswer(false);
        setIsSubmitted(false);
      }
    }
  };

  const handleRecitePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setDetailIndex((prev) => (prev !== null ? prev - 1 : null));
    } else if (offset > 0) {
      navigationRef.current = "end";
      setOffset(offset - limit);
    }
  };

  const handleReciteNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setDetailIndex((prev) => (prev !== null ? prev + 1 : null));
    } else if (hasMore) {
      navigationRef.current = "start";
      setOffset(offset + limit);
    }
  };

  const jumpToQuestion = (index: number) => {
    setCurrentIndex(index);
    setIsSheetOpen(false);
    // State restoration handled by useEffect
    if (mode !== "mock" && !answeredQuestions.hasOwnProperty(index)) {
      setShowAnswer(false);
      setIsSubmitted(false);
    }
  };

  if (loading) return <div className="p-8 text-center">加载题目中...</div>;
  if (questions.length === 0)
    return <div className="p-8 text-center">没找到题目</div>;

  if (showSummary) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const accuracy = Math.round((correctCount / results.length) * 100) || 0;

    return (
      <div className="flex flex-col h-screen bg-gray-50 p-4">
        <Card className="mb-4">
          <CardHeader className="text-center font-bold text-xl">
            {mode === "mock" ? "考试成绩" : "测试结果"}
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-8 border-orange-500 flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  {mode === "mock" ? "总分" : "正确率"}
                </div>
                <div className="text-3xl font-bold text-orange-500">
                  {mode === "mock" ? mockScore : `${accuracy}%`}
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
          {mode === "mock" ? "重新考试" : "重新练习"}
        </Button>
        {hasMore && mode !== "mock" && (
          <Button
            className="w-full mb-2"
            variant="secondary"
            onClick={() => setOffset((prev) => prev + limit)}
          >
            下一批题目
          </Button>
        )}
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
          onClick={() => {
            if (viewMode === "list" && detailIndex !== null) {
              setDetailIndex(null);
            } else {
              window.history.back();
            }
          }}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="font-medium truncate max-w-[200px]">
          {category ||
            (mode === "mock"
              ? "模拟试卷"
              : mode === "mistakes"
              ? "错题强化"
              : mode === "collection"
              ? "试题收藏"
              : "练习")}{" "}
          {viewMode === "list" && detailIndex === null
            ? `(${totalCount})`
            : `(${
                viewMode === "list" && detailIndex !== null
                  ? offset + currentIndex + 1
                  : currentIndex + 1
              }/${
                viewMode === "list" && detailIndex !== null
                  ? totalCount
                  : questions.length
              })`}
        </h1>
        <div className="flex gap-2 items-center">
          {mode === "mock" && (
            <Button
              onClick={handleMockSubmit}
              size="sm"
              variant="destructive"
              className="h-8 px-3 mr-1"
            >
              交卷
            </Button>
          )}
          {mode === "category" && (
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={() => {
                if (viewMode === "card") {
                  setViewMode("list");
                  setOffset(0);
                  setHasMore(true);
                  setQuestions([]);
                  setDetailIndex(null);
                  setQuizParams(null);
                } else {
                  setIsConfiguring(true);
                }
              }}
            >
              {viewMode === "card" ? "背诵模式" : "答题模式"}
            </Button>
          )}
          {!(viewMode === "list" && detailIndex === null) && (
            <>
              <Button variant="ghost" size="icon" onClick={handleCollect}>
                <Star
                  className={`w-6 h-6 ${
                    currentQuestion?.isCollected
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  }`}
                />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {viewMode === "list" && detailIndex === null ? (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <Card
                key={q.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setDetailIndex(i);
                  setCurrentIndex(i);
                }}
              >
                <div className="flex gap-2">
                  <span className="text-gray-500 min-w-8">
                    {offset + i + 1}.
                  </span>
                  <div>
                    <div className="mb-2 font-medium">{q.content}</div>
                    <div className="text-sm text-gray-500 flex gap-2">
                      <span
                        className={
                          q.type === "SINGLE"
                            ? "text-blue-500"
                            : q.type === "MULTIPLE"
                            ? "text-purple-500"
                            : "text-orange-500"
                        }
                      >
                        {q.type === "SINGLE"
                          ? "单选题"
                          : q.type === "MULTIPLE"
                          ? "多选题"
                          : "判断题"}
                      </span>
                      {q.isPracticed && (
                        <span className="text-green-500">已练习</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {showAllAnswers ? (
                        <>
                          <span className="font-medium">答案: </span>
                          {getAnswerText(q.options, q.answer)}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">答案已隐藏</span>
                      )}
                    </div>
                    {showAllAnswers && q.mnemonic && (
                      <div className="mt-1 text-sm text-gray-500">
                        <span className="font-medium">记忆: </span>
                        {q.mnemonic}
                      </div>
                    )}
                    {showAllAnswers && q.note && (
                      <div className="mt-1 text-sm text-blue-500">
                        <span className="font-medium">笔记: </span>
                        {q.note}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <span className="inline-block bg-orange-500 text-white text-xs px-2 py-1 rounded mr-2">
                {currentQuestion.type === "SINGLE"
                  ? "单选题"
                  : currentQuestion.type === "MULTIPLE"
                  ? "多选题"
                  : "判断题"}
              </span>
              <span className="text-lg font-medium">
                {currentQuestion.content}
              </span>
            </div>

            <div className="space-y-3">
              {options.map((opt: any) => {
                const isSelected = selectedAnswers.includes(opt.label);
                const isCorrect = currentQuestion.answer.includes(opt.label);
                const isReciteMode =
                  viewMode === "list" && detailIndex !== null;
                const shouldShowAnswer = showAnswer || isReciteMode;

                let optionStyle = "border-gray-200";
                if (shouldShowAnswer) {
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
                    onClick={() =>
                      !isReciteMode && handleOptionSelect(opt.label)
                    }
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 border ${
                        isSelected || (shouldShowAnswer && isCorrect)
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

            {(showAnswer || (viewMode === "list" && detailIndex !== null)) && (
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
                    <div className="font-bold mb-1 text-orange-600">
                      记忆技巧
                    </div>
                    <div className="text-gray-600 text-sm">
                      {currentQuestion.mnemonic}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="font-bold mb-2 text-gray-700">我的笔记</div>
                  <Textarea
                    placeholder="在这里输入你的笔记..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mb-2 bg-white"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="w-full"
                  >
                    {isSavingNote ? "保存中..." : "保存笔记"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white p-4 border-t flex justify-between items-center">
        {viewMode === "list" && detailIndex === null ? (
          <>
            <Button
              variant="ghost"
              className="flex-col gap-1 h-auto py-2"
              onClick={() => setShowAllAnswers(!showAllAnswers)}
            >
              {showAllAnswers ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
              <span className="text-xs">
                {showAllAnswers ? "隐藏答案" : "显示答案"}
              </span>
            </Button>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                上一页
              </Button>
              <span className="text-sm font-medium">
                第 {Math.floor(offset / limit) + 1} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(offset + limit)}
                disabled={!hasMore}
              >
                下一页
              </Button>
            </div>
          </>
        ) : viewMode === "list" && detailIndex !== null ? (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDetailIndex(null)}
            >
              返回列表
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRecitePrev}
              disabled={currentIndex === 0 && offset === 0}
            >
              上一题
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={handleReciteNext}
              disabled={!hasMore && currentIndex === questions.length - 1}
            >
              下一题
            </Button>
          </div>
        ) : (
          <>
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
                  <Button
                    variant="ghost"
                    className="flex-col gap-1 h-auto py-2"
                  >
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
                      const isAnswered =
                        answeredQuestions.hasOwnProperty(index);
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
                        <div
                          key={`${q.id}-${index}`}
                          className="flex flex-col items-center gap-1"
                        >
                          <button
                            onClick={() => jumpToQuestion(index)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${bgClass}`}
                          >
                            {index + 1}
                          </button>
                          <span className="text-[10px] text-gray-400 truncate max-w-full px-1">
                            {q.type === "SINGLE"
                              ? "单选"
                              : q.type === "MULTIPLE"
                              ? "多选"
                              : "判断"}
                          </span>
                        </div>
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
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      当前
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
              {mode === "mock" ? (
                currentIndex < questions.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    下一题
                  </Button>
                ) : null
              ) : isSubmitted || showAnswer ? (
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
          </>
        )}
      </footer>

      <Dialog open={isConfiguring} onOpenChange={setIsConfiguring}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>答题设置</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">题目数量</Label>
              <Select
                value={quizConfig.count}
                onValueChange={(val) =>
                  setQuizConfig({ ...quizConfig, count: val })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择数量" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10题</SelectItem>
                  <SelectItem value="20">20题</SelectItem>
                  <SelectItem value="50">50题</SelectItem>
                  <SelectItem value="100">100题</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">出题顺序</Label>
              <RadioGroup
                value={quizConfig.random ? "random" : "sequential"}
                onValueChange={(val) =>
                  setQuizConfig({ ...quizConfig, random: val === "random" })
                }
                className="col-span-3 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sequential" id="sequential" />
                  <Label htmlFor="sequential">顺序</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="random" id="random" />
                  <Label htmlFor="random">随机</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsConfiguring(false);
                setViewMode("card");
                setOffset(0);
                setHasMore(true);
                setQuestions([]);
                setDetailIndex(null);
                setQuizParams({
                  limit: parseInt(quizConfig.count),
                  random: quizConfig.random,
                });
              }}
            >
              开始答题
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
