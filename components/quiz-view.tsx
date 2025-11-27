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
  Pause,
  Play,
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
  image: string | null;
  isPracticed?: boolean;
  // 全局状态：①未做 ②做对/做错 ③收藏过 ④背诵过
  status?: "unanswered" | "correct" | "incorrect";
  isRecited?: boolean;
  lastAnswered?: string; // 用户上次答案
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

  // 位置记录相关 - 重新设计
  const getPositionKey = () => {
    return `quiz-position-${mode}-${category || "all"}`;
  };

  // 保存位置：同时保存页码、题目索引和滚动位置
  const savePosition = (
    pageOffset: number,
    questionIndex: number = 0,
    scrollTop?: number
  ) => {
    const positionData = {
      offset: pageOffset,
      questionIndex,
      scrollTop:
        scrollTop ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0,
      timestamp: Date.now(),
    };
    localStorage.setItem(getPositionKey(), JSON.stringify(positionData));
    console.log("保存位置:", positionData);
  };

  const loadSavedPosition = () => {
    try {
      const saved = localStorage.getItem(getPositionKey());
      if (saved) {
        const positionData = JSON.parse(saved);
        console.log("加载保存位置:", positionData);
        return positionData;
      }
    } catch (error) {
      console.error("Failed to load saved position:", error);
    }
    return null;
  };

  // 恢复位置函数
  const restorePosition = (positionData: any) => {
    if (!positionData) return;

    console.log("尝试恢复位置:", positionData);

    // 方法1: 尝试滚动到具体题目
    if (positionData.questionIndex < questions.length) {
      const targetElement = questionRefs.current[positionData.questionIndex];
      if (targetElement) {
        console.log("使用题目元素滚动");
        setTimeout(() => {
          targetElement.scrollIntoView({
            behavior: "auto", // 使用瞬时滚动，避免动画干扰
            block: "start",
          });
        }, 200);
        return;
      }
    }

    // 方法2: 使用保存的滚动位置
    if (positionData.scrollTop > 0) {
      console.log("使用滚动位置恢复");
      setTimeout(() => {
        window.scrollTo({
          top: positionData.scrollTop,
          behavior: "auto",
        });
      }, 300);
    }
  };
  const skipFetchRef = useRef(false);
  const navigationRef = useRef<"start" | "end" | null>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shouldScrollToPosition = useRef(false);
  const [visibleQuestionIndex, setVisibleQuestionIndex] = useState(0);
  const lastSavedPositionRef = useRef<any>(null);

  // 页面离开时保存位置 + 滚动事件监听
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (viewMode === "list") {
        const currentScrollTop =
          document.documentElement.scrollTop || document.body.scrollTop;
        savePosition(offset, visibleQuestionIndex, currentScrollTop);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && viewMode === "list") {
        const currentScrollTop =
          document.documentElement.scrollTop || document.body.scrollTop;
        savePosition(offset, visibleQuestionIndex, currentScrollTop);
      }
    };

    // 滚动事件监听 - 定期保存位置
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      if (viewMode === "list") {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const currentScrollTop =
            document.documentElement.scrollTop || document.body.scrollTop;
          // 计算当前可见的大致题目索引
          const estimatedIndex = Math.floor(currentScrollTop / 150); // 假设每题150px高度
          const actualIndex = Math.min(estimatedIndex, questions.length - 1);
          savePosition(offset, Math.max(0, actualIndex), currentScrollTop);
          console.log("滚动保存位置:", {
            offset,
            actualIndex,
            currentScrollTop,
          });
        }, 1000); // 1秒后保存，防止频繁保存
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
      // 组件卸载时保存位置
      if (viewMode === "list") {
        const currentScrollTop =
          document.documentElement.scrollTop || document.body.scrollTop;
        savePosition(offset, visibleQuestionIndex, currentScrollTop);
      }
    };
  }, [viewMode, offset, visibleQuestionIndex, questions.length]);

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

  // Timer state for mock mode
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes in seconds
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (mode !== "mock" || showSummary || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleMockSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, showSummary, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Track answered questions to show status in sheet
  const [answeredQuestions, setAnsweredQuestions] = useState<
    Record<number, boolean>
  >({});

  // 状态管理函数
  const toggleCollection = async (questionId: number) => {
    try {
      const currentQuestion = questions.find((q) => q.id === questionId);
      const newIsCollected = !currentQuestion?.isCollected;

      const response = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, isCollected: newIsCollected }),
      });

      if (response.ok) {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, isCollected: newIsCollected } : q
          )
        );
      }
    } catch (error) {
      console.error("Toggle collection error:", error);
    }
  };

  const toggleRecited = async (questionId: number) => {
    try {
      const currentQuestion = questions.find((q) => q.id === questionId);
      const newIsRecited = !currentQuestion?.isRecited;

      const response = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, isRecited: newIsRecited }),
      });

      if (response.ok) {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId ? { ...q, isRecited: newIsRecited } : q
          )
        );
      }
    } catch (error) {
      console.error("Toggle recited error:", error);
    }
  };

  const updateQuestionStatus = (
    questionId: number,
    userAnswer: string,
    correctAnswer: string
  ) => {
    const isCorrect = userAnswer === correctAnswer;
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              status: isCorrect ? "correct" : "incorrect",
              lastAnswered: userAnswer,
            }
          : q
      )
    );
  };

  const [allUserAnswers, setAllUserAnswers] = useState<
    Record<number, string[]>
  >({});
  const [mockScore, setMockScore] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [isCheckingResume, setIsCheckingResume] = useState(mode === "mock");
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  // Ref to hold current state for event listeners
  const stateRef = useRef({
    questions,
    currentIndex,
    timeLeft,
    allUserAnswers,
    answeredQuestions,
    results,
    showSummary,
  });

  useEffect(() => {
    stateRef.current = {
      questions,
      currentIndex,
      timeLeft,
      allUserAnswers,
      answeredQuestions,
      results,
      showSummary,
    };
  }, [
    questions,
    currentIndex,
    timeLeft,
    allUserAnswers,
    answeredQuestions,
    results,
    showSummary,
  ]);

  const saveMockProgress = () => {
    if (mode !== "mock" || questions.length === 0 || showSummary) return;

    const state = {
      questions,
      currentIndex,
      timeLeft,
      allUserAnswers,
      answeredQuestions,
      results,
      timestamp: Date.now(),
    };
    localStorage.setItem("MOCK_EXAM_STATE", JSON.stringify(state));
  };

  const clearMockProgress = () => {
    localStorage.removeItem("MOCK_EXAM_STATE");
  };

  const loadMockProgress = () => {
    try {
      const saved = localStorage.getItem("MOCK_EXAM_STATE");
      if (saved) {
        const state = JSON.parse(saved);
        setQuestions(state.questions);
        setCurrentIndex(state.currentIndex);
        setTimeLeft(state.timeLeft);
        setAllUserAnswers(state.allUserAnswers);
        setAnsweredQuestions(state.answeredQuestions);
        setResults(state.results);
        setTotalCount(state.questions.length);
        setLoading(false);
        setIsPaused(true); // Start paused when resuming

        // Prevent fetching new questions
        skipFetchRef.current = true;
        setIsCheckingResume(false);
      }
    } catch (e) {
      console.error("Failed to load mock progress", e);
      toast.error("无法恢复上次考试进度");
      clearMockProgress();
      setIsCheckingResume(false);
    }
  };

  // Check for saved progress on mount
  useEffect(() => {
    if (mode === "mock") {
      const saved = localStorage.getItem("MOCK_EXAM_STATE");
      if (saved) {
        setShowResumeDialog(true);
      } else {
        setIsCheckingResume(false);
      }
    }
  }, [mode]);

  // Pause timer when visibility changes (e.g. switching tabs)
  useEffect(() => {
    if (mode !== "mock") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
        // Save state using ref
        const state = stateRef.current;
        if (state.questions.length > 0 && !state.showSummary) {
          localStorage.setItem(
            "MOCK_EXAM_STATE",
            JSON.stringify({
              ...state,
              timestamp: Date.now(),
            })
          );
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mode]);

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

      if (mode === "mock" && isCheckingResume) return;

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
  }, [mode, category, offset, viewMode, quizParams, isCheckingResume]);

  // 位置恢复 - 只在进入list模式且第一次加载时执行
  useEffect(() => {
    if (viewMode === "list" && !isCheckingResume && questions.length === 0) {
      const savedPosition = loadSavedPosition();
      if (savedPosition && savedPosition.offset !== offset) {
        shouldScrollToPosition.current = true;
        setOffset(savedPosition.offset);
        // offset改变会触发重新fetch，然后在数据加载后设置detailIndex
        return;
      } else if (savedPosition && savedPosition.offset === offset) {
        // 如果offset相同但是首次加载，也需要滚动
        shouldScrollToPosition.current = true;
      }
    }
  }, [viewMode, mode, category]);

  // 在questions加载完成后滚动到保存的题目位置
  useEffect(() => {
    console.log("Scroll effect triggered:", {
      viewMode,
      questionsLength: questions.length,
      shouldScroll: shouldScrollToPosition.current,
    });

    if (
      viewMode === "list" &&
      questions.length > 0 &&
      shouldScrollToPosition.current
    ) {
      const savedPosition = loadSavedPosition();
      console.log("Saved position:", savedPosition);
      console.log("Current offset:", offset);

      if (
        savedPosition &&
        savedPosition.offset === offset &&
        savedPosition.questionIndex < questions.length
      ) {
        console.log(
          "Attempting to scroll to index:",
          savedPosition.questionIndex
        );

        // 增加更长的延迟以确保DOM完全渲染
        setTimeout(() => {
          const targetElement =
            questionRefs.current[savedPosition.questionIndex];
          console.log("Target element:", targetElement);
          console.log("All refs:", questionRefs.current);

          if (targetElement) {
            console.log("Scrolling to element");
            targetElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          } else {
            console.warn("Target element not found, refs not ready yet");
          }
          shouldScrollToPosition.current = false;
        }, 500); // 增加到500ms
      }
    }
  }, [questions, viewMode, offset]);

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

  // 设置Intersection Observer来跟踪可见的题目
  useEffect(() => {
    // 初始化refs数组
    questionRefs.current = new Array(questions.length).fill(null);

    if (viewMode === "list" && questions.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const index = Number(
                entry.target.getAttribute("data-question-index")
              );
              if (!isNaN(index)) {
                setVisibleQuestionIndex(index);
                // 保存当前可见题目的位置
                savePosition(offset, index);
              }
            }
          });
        },
        {
          threshold: 0.5, // 当题目50%可见时触发
          rootMargin: "-50px 0px -50px 0px", // 减少触发区域，更精确定位
        }
      );

      // 观察所有题目元素
      questionRefs.current.forEach((ref) => {
        if (ref) {
          observer.observe(ref);
        }
      });

      return () => {
        observer.disconnect();
      };
    }
  }, [questions, viewMode, offset]);

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
    clearMockProgress();
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
        }
        // No partial credit for multiple choice
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

    // 更新题目状态
    updateQuestionStatus(
      currentQuestion.id,
      userAnswer,
      currentQuestion.answer
    );

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
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setDetailIndex((prev) => (prev !== null ? prev - 1 : null));
      savePosition(offset, newIndex); // 保存新位置
    } else if (offset > 0) {
      navigationRef.current = "end";
      const newOffset = offset - limit;
      setOffset(newOffset);
      savePosition(newOffset, 0); // 保存新页面位置
    }
  };

  const handleReciteNext = () => {
    if (currentIndex < questions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setDetailIndex((prev) => (prev !== null ? prev + 1 : null));
      savePosition(offset, newIndex); // 保存新位置
    } else if (hasMore) {
      navigationRef.current = "start";
      const newOffset = offset + limit;
      setOffset(newOffset);
      savePosition(newOffset, 0); // 保存新页面位置
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

  if (isCheckingResume) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>恢复考试</AlertDialogTitle>
              <AlertDialogDescription>
                检测到您有未完成的模拟考试，是否继续上次的进度？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  clearMockProgress();
                  setIsCheckingResume(false);
                  setShowResumeDialog(false);
                }}
              >
                重新开始
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  loadMockProgress();
                  setShowResumeDialog(false);
                }}
              >
                继续考试
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

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
              if (mode === "mock") {
                saveMockProgress();
              }
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
            <>
              <div className="flex items-center gap-1 mr-1 text-orange-500 font-mono font-bold text-sm">
                {formatTime(timeLeft)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={handleMockSubmit}
                size="sm"
                variant="destructive"
                className="h-8 px-3 mr-1"
              >
                交卷
              </Button>
            </>
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

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold mb-4">考试暂停</div>
          <div className="text-4xl font-mono text-orange-500 mb-8">
            {formatTime(timeLeft)}
          </div>
          <Button size="lg" onClick={() => setIsPaused(false)}>
            <Play className="w-5 h-5 mr-2" />
            继续考试
          </Button>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {viewMode === "list" && detailIndex === null ? (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div
                key={`${offset}-${i}-${q.id}`}
                ref={(el) => {
                  questionRefs.current[i] = el;
                }}
                data-question-index={i}
              >
                <Card
                  className="p-2 cursor-pointer hover:shadow-md transition-shadow gap-0"
                  onClick={() => {
                    setDetailIndex(i);
                    setCurrentIndex(i);
                    // 保存当前位置（包含滚动位置）
                    const currentScrollTop =
                      document.documentElement.scrollTop ||
                      document.body.scrollTop;
                    savePosition(offset, i, currentScrollTop);
                  }}
                >
                  <div className="flex gap-2">
                    <div className="flex flex-col items-center min-w-8">
                      <span className="text-gray-500 mb-1">
                        {offset + i + 1}.
                      </span>
                      {/* 题目类型标签 */}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          q.type === "SINGLE"
                            ? "bg-blue-100 text-blue-600"
                            : q.type === "MULTIPLE"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {q.type === "SINGLE"
                          ? "单选"
                          : q.type === "MULTIPLE"
                          ? "多选"
                          : "判断"}
                      </span>
                    </div>
                    <div className="flex-1">
                      {/* 做题状态标签区域 */}
                      {(q.status === "correct" || q.status === "incorrect") && (
                        <div className="flex items-center gap-2 mb-2">
                          {q.status === "correct" && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-600">
                              做对
                            </span>
                          )}
                          {q.status === "incorrect" && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-600">
                              做错
                            </span>
                          )}
                        </div>
                      )}

                      {/* 题目内容 */}
                      <div className="mb-2 font-medium">{q.content}</div>

                      {/* 题目图片 */}
                      {q.image && (
                        <div className="mb-2">
                          <img
                            src={q.image}
                            alt="Question Image"
                            className="max-w-full h-auto rounded-lg"
                          />
                        </div>
                      )}
                      {/* 答案显示区域 */}
                      <div className="mt-2 text-sm text-gray-600">
                        {showAllAnswers ? (
                          <>
                            <span className="font-medium">答案: </span>
                            {getAnswerText(q.options, q.answer)}
                          </>
                        ) : (
                          <span className="text-gray-400 italic">
                            答案已隐藏
                          </span>
                        )}
                      </div>
                      {showAllAnswers && q.note && (
                        <div className="mt-1 text-sm text-blue-500">
                          <span className="font-medium">笔记: </span>
                          {q.note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 记忆内容（绿色加粗） - 移到外层 */}
                  {q.mnemonic && (
                    <div className="mt-0 p-2 rounded">
                      <span className="text-green-700 font-bold text-sm">
                        记忆: {q.mnemonic}
                      </span>
                    </div>
                  )}

                  {/* 收藏和背诵控制区域 - 移到外层 */}
                  <div className="mt-0 flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollection(q.id);
                      }}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        q.isCollected
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {q.isCollected ? (
                        <>
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          已收藏
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                          收藏
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRecited(q.id);
                      }}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        q.isRecited
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {q.isRecited ? (
                        <>
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          已背诵
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          标记背诵
                        </>
                      )}
                    </button>
                  </div>
                </Card>
              </div>
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

            {currentQuestion.image && (
              <div className="mb-4">
                <img
                  src={currentQuestion.image}
                  alt="Question Image"
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}

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
                onClick={() => {
                  const newOffset = Math.max(0, offset - limit);
                  setOffset(newOffset);
                  savePosition(newOffset, 0); // 切换页面时保存位置
                }}
                disabled={offset === 0}
              >
                上一页
              </Button>
              <span className="text-sm font-medium">
                {Math.floor(offset / limit) + 1}/{Math.ceil(totalCount / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOffset = offset + limit;
                  setOffset(newOffset);
                  savePosition(newOffset, 0); // 切换页面时保存位置
                }}
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
