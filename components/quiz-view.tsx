"use client";

import { useState, useEffect, useRef } from "react";
import {
  useQuery,
  keepPreviousData,
  useQueryClient,
} from "@tanstack/react-query";
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
  Bookmark,
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
  DialogDescription,
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
import { Progress } from "@/components/ui/progress";

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
  filterType?: string;
  isPaid?: boolean;
}

const getFilterLabel = (filter?: string) => {
  switch (filter) {
    case "unanswered":
      return "未做";
    case "correct":
      return "做对";
    case "incorrect":
      return "做错";
    case "collected":
      return "收藏";
    case "viewed":
      return "已浏览";
    case "unviewed":
      return "未浏览";
    default:
      return "";
  }
};

export function QuizView({
  mode,
  category,
  filterType,
  isPaid = false,
}: QuizViewProps) {
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(mode === "notes");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPageSheetOpen, setIsPageSheetOpen] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<"card" | "list">(
    mode === "category" || filterType ? "list" : "card"
  );
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [showAllAnswers, setShowAllAnswers] = useState(
    mode === "category" || !!filterType
  );
  const [totalCount, setTotalCount] = useState(0);
  const limit = 50;

  // 位置记录相关 - 重新设计
  const getPositionKey = () => {
    return `quiz-position-${mode}-${category || "all"}-${filterType || "all"}`;
  };

  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // 保存位置：同时保存页码、题目索引和滚动位置
  const savePosition = (
    pageOffset: number,
    questionIndex: number = 0,
    scrollTop?: number
  ) => {
    const currentScrollTop =
      scrollTop !== undefined
        ? scrollTop
        : scrollContainerRef.current?.scrollTop || 0;

    // 防御性检查：如果题目索引大于0但滚动位置为0，说明可能处于异常状态（如组件卸载中），不保存
    if (questionIndex > 0 && currentScrollTop === 0) {
      console.log("忽略异常位置保存: index > 0 但 scrollTop = 0");
      return;
    }

    const positionData = {
      offset: pageOffset,
      questionIndex,
      scrollTop: currentScrollTop,
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
    if (!positionData) return false;

    // 如果是初始位置(0,0)，直接滚动到顶部并返回成功
    if (positionData.questionIndex === 0 && positionData.scrollTop === 0) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0 });
        return true;
      }
      return false;
    }

    console.log("尝试恢复位置:", positionData);

    // 方法1: 优先使用保存的滚动位置 (更精确，避免漂移)
    if (positionData.scrollTop >= 0 && scrollContainerRef.current) {
      console.log("使用滚动位置恢复");
      scrollContainerRef.current.scrollTo({
        top: positionData.scrollTop,
        behavior: "auto",
      });
      return true;
    }

    // 方法2: 尝试滚动到具体题目 (降级方案)
    // 只有当索引大于0时才优先使用scrollIntoView，否则如果是0，可能只是页面顶部
    if (
      positionData.questionIndex > 0 &&
      positionData.questionIndex < questions.length
    ) {
      const targetElement = questionRefs.current[positionData.questionIndex];
      if (targetElement) {
        console.log("使用题目元素滚动");
        targetElement.scrollIntoView({
          behavior: "auto", // 使用瞬时滚动，避免动画干扰
          block: "start",
        });
        // 稍微修正一下位置，避免被header遮挡
        // 注意：如果是容器内滚动，window.scrollBy无效，需要滚动容器
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy(0, -60);
        }
        return true;
      }
    }

    return false;
  };
  const skipFetchRef = useRef(false);
  const navigationRef = useRef<"start" | "end" | null>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shouldScrollToPosition = useRef(false);
  const [visibleQuestionIndex, setVisibleQuestionIndex] = useState(0);
  const visibleQuestionIndexRef = useRef(0);
  const lastSavedPositionRef = useRef<any>(null);
  const lastLoadedKeyRef = useRef<string>("");
  const isNavigatingToDetailRef = useRef(false);
  const lastFirstQuestionIdRef = useRef<number | null>(null);

  // 当回到列表模式时，重置导航标记
  useEffect(() => {
    if (viewMode === "list" && detailIndex === null) {
      isNavigatingToDetailRef.current = false;
    }
  }, [viewMode, detailIndex]);

  // 页面离开时保存位置 + 滚动事件监听
  useEffect(() => {
    const container = scrollContainerRef.current;

    const handleBeforeUnload = () => {
      if (
        viewMode === "list" &&
        detailIndex === null &&
        !isNavigatingToDetailRef.current
      ) {
        const currentScrollTop = container?.scrollTop || 0;
        savePosition(offset, visibleQuestionIndexRef.current, currentScrollTop);
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        viewMode === "list" &&
        detailIndex === null &&
        !isNavigatingToDetailRef.current
      ) {
        const currentScrollTop = container?.scrollTop || 0;
        savePosition(offset, visibleQuestionIndexRef.current, currentScrollTop);
      }
    };

    // 滚动事件监听 - 定期保存位置
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      if (
        viewMode === "list" &&
        detailIndex === null &&
        !isNavigatingToDetailRef.current &&
        !shouldScrollToPosition.current
      ) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const currentScrollTop = container?.scrollTop || 0;

          // 主动计算当前可见的题目索引，作为双重保障
          let activeIndex = visibleQuestionIndexRef.current;
          const headerOffset = 200; // 头部偏移量，调大一点以避免选中已经滚出一半的题目

          // 只有当IntersectionObserver没有更新或者我们需要更精确的滚动停止位置时才计算
          // 这里我们总是计算一次以确保准确性
          for (let i = 0; i < questionRefs.current.length; i++) {
            const el = questionRefs.current[i];
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            // 找到第一个底部在头部下方的元素（即当前最上方可见的元素）
            if (rect.bottom > headerOffset) {
              activeIndex = i;
              break;
            }
          }

          if (activeIndex !== visibleQuestionIndexRef.current) {
            visibleQuestionIndexRef.current = activeIndex;
            setVisibleQuestionIndex(activeIndex);
          }

          savePosition(offset, activeIndex, currentScrollTop);
        }, 300);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("visibilitychange", handleVisibilityChange);

    // 监听容器的滚动事件，而不是window
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      clearTimeout(scrollTimeout);
      // 组件卸载时保存位置，但只有在题目已加载的情况下才保存
      // 防止初始加载或offset切换时的空状态覆盖了正确的保存位置
      // 同时也防止进入详情页时保存错误位置
      if (
        viewMode === "list" &&
        detailIndex === null &&
        questions.length > 0 &&
        !isNavigatingToDetailRef.current &&
        scrollContainerRef.current
      ) {
        const currentScrollTop = scrollContainerRef.current.scrollTop;
        savePosition(offset, visibleQuestionIndexRef.current, currentScrollTop);
      }
    };
  }, [
    viewMode,
    offset,
    questions.length,
    detailIndex,
    mode,
    category,
    filterType,
  ]);

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
    const currentQuestion = questions.find((q) => q.id === questionId);
    if (!currentQuestion) return;

    const newIsCollected = !currentQuestion.isCollected;

    // Optimistic update query cache
    const queryKey = [
      "questions",
      mode,
      category,
      filterType,
      offset,
      quizParams,
      viewMode === "card" && mode === "category" ? "card-practiced" : "normal",
    ];

    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((q: Question) =>
          q.id === questionId ? { ...q, isCollected: newIsCollected } : q
        ),
      };
    });

    try {
      const response = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, isCollected: newIsCollected }),
      });

      if (!response.ok) {
        throw new Error("Failed to update collection");
      }
      // toast.success(newIsCollected ? "已收藏" : "已取消收藏");
    } catch (error) {
      console.error("Toggle collection error:", error);
      toast.error("操作失败");
      // Revert query cache
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((q: Question) =>
            q.id === questionId ? { ...q, isCollected: !newIsCollected } : q
          ),
        };
      });
    }
  };

  const toggleRecited = async (questionId: number) => {
    const currentQuestion = questions.find((q) => q.id === questionId);
    if (!currentQuestion) return;

    const newIsRecited = !currentQuestion.isRecited;

    // Optimistic update query cache
    const queryKey = [
      "questions",
      mode,
      category,
      filterType,
      offset,
      quizParams,
      viewMode === "card" && mode === "category" ? "card-practiced" : "normal",
    ];

    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((q: Question) =>
          q.id === questionId ? { ...q, isRecited: newIsRecited } : q
        ),
      };
    });

    try {
      const response = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, isRecited: newIsRecited }),
      });

      if (!response.ok) {
        throw new Error("Failed to update recited status");
      }
      // toast.success(newIsRecited ? "已标记背诵" : "已取消背诵");
    } catch (error) {
      console.error("Toggle recited error:", error);
      toast.error("操作失败");
      // Revert query cache
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((q: Question) =>
            q.id === questionId ? { ...q, isRecited: !newIsRecited } : q
          ),
        };
      });
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
              isPracticed: true,
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

  const {
    data: queryData,
    isLoading: isQueryLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "questions",
      mode,
      category,
      filterType,
      offset,
      quizParams,
      viewMode === "card" && mode === "category" ? "card-practiced" : "normal",
    ],
    queryFn: async () => {
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

      if (filterType) {
        url += `&filterType=${filterType}`;
      }

      // 答题模式下（card view），默认过滤掉已做过的题目
      if (mode === "category" && viewMode === "card" && !filterType) {
        url += `&filterPracticed=true`;
      }
      const res = await fetch(url);
      return res.json();
    },
    enabled: !(mode === "mock" && isCheckingResume) && !skipFetchRef.current,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (queryData) {
      const { data, total } = queryData;
      if (data.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      // Only update questions if we are not in a state where we should preserve local changes
      // But since we sync local changes to server immediately (collect, note), it might be fine.
      // However, for 'status' (correct/incorrect) which is local-first in some modes?
      // Actually, the previous code overwrote questions on every fetch.

      // Check if it's the same batch of questions (to prevent resetting index on optimistic updates)
      const currentFirstId = data.length > 0 ? data[0].id : null;
      const isSameBatch = lastFirstQuestionIdRef.current === currentFirstId;
      lastFirstQuestionIdRef.current = currentFirstId;

      setQuestions(data);
      setTotalCount(total);
      setLoading(false);

      if (navigationRef.current === "end") {
        const newIndex = data.length - 1;
        setCurrentIndex(newIndex);
        if (viewMode === "list") setDetailIndex(newIndex);
      } else if (!isSameBatch) {
        // 默认重置到第一题（除非是位置恢复逻辑稍后会覆盖它，但这里重置是安全的）
        // 注意：这里不要重置 visibleQuestionIndexRef，因为它用于位置恢复
        // 只有当题目批次发生变化时才重置索引，避免收藏/背诵操作导致跳转
        setCurrentIndex(0);
        if (viewMode === "list" && detailIndex !== null) setDetailIndex(0);
      }

      navigationRef.current = null;

      if (!isSameBatch) {
        setResults([]);
        setAnsweredQuestions({});
        setShowSummary(false);
      }
    } else if (!isQueryLoading && !queryData) {
      // Handle case where loading finished but no data (e.g. error or empty)
      setLoading(false);
    }
  }, [queryData, isQueryLoading]);

  // Sync loading state
  // useEffect(() => {
  //   setLoading(isQueryLoading);
  // }, [isQueryLoading]);

  // Removed original fetchQuestions useEffect

  // 位置恢复 - 只在进入list模式且第一次加载时执行
  useEffect(() => {
    if (viewMode === "list" && !isCheckingResume) {
      const currentKey = getPositionKey();

      // 如果key变化了（切换了分类），重置加载状态
      if (lastLoadedKeyRef.current !== currentKey) {
        lastSavedPositionRef.current = null;
        lastLoadedKeyRef.current = currentKey;
        visibleQuestionIndexRef.current = 0;
      }

      // 只有当questions为空（首次加载）或者我们明确知道需要恢复时才执行
      // 注意：由于使用了react-query，questions可能不为空（缓存），所以不能只依赖questions.length === 0
      // 我们使用一个ref来标记是否已经尝试过恢复
      if (!lastSavedPositionRef.current) {
        const savedPosition = loadSavedPosition();
        if (savedPosition) {
          lastSavedPositionRef.current = savedPosition; // 标记已读取

          if (savedPosition.offset !== offset) {
            shouldScrollToPosition.current = true;
            setOffset(savedPosition.offset);
            return;
          } else if (savedPosition.offset === offset) {
            shouldScrollToPosition.current = true;
          }
        } else {
          // 如果没有保存的位置，且offset不为0（可能是从其他分类切换过来的），重置offset
          if (offset !== 0) {
            setOffset(0);
          }
        }
      }
    }
  }, [viewMode, mode, category, filterType]);

  // 在questions加载完成后滚动到保存的题目位置
  useEffect(() => {
    console.log("Scroll effect triggered:", {
      viewMode,
      questionsLength: questions.length,
      shouldScroll: shouldScrollToPosition.current,
      detailIndex,
    });

    if (
      viewMode === "list" &&
      detailIndex === null &&
      questions.length > 0 &&
      shouldScrollToPosition.current
    ) {
      const savedPosition = loadSavedPosition();
      console.log("Saved position:", savedPosition);
      console.log("Current offset:", offset);

      if (savedPosition && savedPosition.offset === offset) {
        // 尝试多次恢复位置，以应对图片加载导致的布局变化
        let attempts = 0;
        const tryRestore = () => {
          const success = restorePosition(savedPosition);
          if (!success && attempts < 20) {
            // Increase attempts
            attempts++;
            setTimeout(tryRestore, 100);
          } else if (success) {
            shouldScrollToPosition.current = false;
            // 再次确认，防止图片加载后的偏移
            setTimeout(() => restorePosition(savedPosition), 500);
          }
        };

        // 立即尝试
        setTimeout(tryRestore, 50);
      }
    }
  }, [questions, viewMode, offset, detailIndex, mode, category, filterType]);

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
        setShowAnswer(mode === "notes");
        setIsSubmitted(false);
      }
    }
  }, [currentIndex, questions, allUserAnswers, mode]);

  // 设置Intersection Observer来跟踪可见的题目
  useEffect(() => {
    // 初始化refs数组
    questionRefs.current = new Array(questions.length).fill(null);

    if (viewMode === "list" && detailIndex === null && questions.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const index = Number(
                entry.target.getAttribute("data-question-index")
              );
              if (!isNaN(index)) {
                // 更新当前索引
                visibleQuestionIndexRef.current = index;
                setVisibleQuestionIndex(index);

                // 实时保存位置（为了性能，这里不频繁写入localStorage，主要依赖scroll事件）
                // 但如果用户只是慢慢滑动，这里能提供更即时的反馈
              }
            }
          });
        },
        {
          root: scrollContainerRef.current, // 使用滚动容器作为root
          // 视口顶部向下偏移80px（避开header），底部向上偏移80%（只关注顶部区域）
          // 这样只有当题目进入屏幕上方的"阅读区"时才会触发
          rootMargin: "-80px 0px -80% 0px",
          threshold: 0,
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
  }, [questions, viewMode, offset, detailIndex]);
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
    // Use the new toggleCollection function which handles optimistic updates
    if (currentQuestion) {
      toggleCollection(currentQuestion.id);
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
        setShowAnswer(mode === "notes");
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
        setShowAnswer(mode === "notes");
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
      savePosition(newOffset, 0, 0); // 保存新页面位置，重置滚动
    }
  };

  const handleReciteNext = () => {
    if (currentIndex < questions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setDetailIndex((prev) => (prev !== null ? prev + 1 : null));
      savePosition(offset, newIndex); // 保存新位置
    } else if (hasMore) {
      if (!checkSubscription()) return;
      navigationRef.current = "start";
      const newOffset = offset + limit;
      setOffset(newOffset);
      savePosition(newOffset, 0, 0); // 保存新页面位置，重置滚动
    }
  };

  const jumpToQuestion = (index: number) => {
    setCurrentIndex(index);
    setIsSheetOpen(false);
    // State restoration handled by useEffect
    if (mode !== "mock" && !answeredQuestions.hasOwnProperty(index)) {
      setShowAnswer(mode === "notes");
      setIsSubmitted(false);
    }
  };

  // Progress bar effect
  useEffect(() => {
    if (loading || isQueryLoading || (questions.length === 0 && isFetching)) {
      setProgress(13);
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress >= 90) {
            return 90;
          }
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 90);
        });
      }, 500);

      return () => {
        clearInterval(timer);
      };
    } else {
      setProgress(100);
    }
  }, [loading, isQueryLoading, isFetching, questions.length]);

  const handleSubscribe = async () => {
    setIsCheckingSubscription(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Subscription failed:", errorData);
        toast.error(`无法启动支付: ${errorData.error || "请稍后重试"}`);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("发生错误");
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const checkSubscription = () => {
    if (!isPaid) {
      setShowSubscriptionDialog(true);
      return false;
    }
    return true;
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

  if (loading || isQueryLoading || (questions.length === 0 && isFetching))
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-lg font-medium text-muted-foreground">
          题目加载中...
        </div>
        <Progress value={progress} className="w-[60%] md:w-[40%]" />
      </div>
    );
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
              // 返回列表时，不需要手动保存位置，因为我们希望恢复到进入时的位置
              // 或者如果用户在详情页翻页了，我们希望回到新的位置？
              // 目前逻辑是：进入详情页时保存了位置。
              // 如果在详情页翻页了，currentIndex变了。
              // 返回时，我们应该回到currentIndex对应的位置。

              // 让我们更新一下保存的位置，把questionIndex更新为当前的currentIndex
              // 但是scrollTop应该怎么处理？
              // 如果题目变了，原来的scrollTop可能不准确。
              // 最好是让restorePosition去处理滚动到currentIndex

              // 读取之前保存的scrollTop，以便尽可能保持上下文（如果是同一题）
              // 但如果是不同题，scrollIntoView会自动处理

              const saved = loadSavedPosition();
              if (saved) {
                // 更新索引为当前浏览的题目
                savePosition(saved.offset, currentIndex, saved.scrollTop);
              }

              setDetailIndex(null);
              // 触发一次恢复逻辑
              shouldScrollToPosition.current = true;
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
        <h1 className="font-medium flex items-center gap-1 overflow-hidden">
          <span className="truncate max-w-[150px]">
            {category ||
              (mode === "mock"
                ? "模拟试卷"
                : mode === "mistakes"
                ? "错题强化"
                : mode === "collection"
                ? "试题收藏"
                : mode === "notes"
                ? "我的笔记"
                : "练习")}
          </span>
          {category && filterType && filterType !== "all" && (
            <span className="text-base font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md whitespace-nowrap flex-shrink-0">
              {getFilterLabel(filterType)}
            </span>
          )}
          <span className="flex-shrink-0">
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
          </span>
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
          {mode === "category" &&
            !(viewMode === "list" && detailIndex !== null) && (
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
          {viewMode === "card" && <>{/* 移除收藏和设置按钮 */}</>}
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
      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
        {viewMode === "list" && detailIndex === null ? (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div
                key={`${offset}-${i}-${q.id}`}
                ref={(el) => {
                  questionRefs.current[i] = el;
                }}
                data-question-index={i}
                className="scroll-mt-24"
              >
                <Card
                  className="p-2 cursor-pointer hover:shadow-md transition-shadow gap-0"
                  onClick={() => {
                    // 标记正在导航到详情页，阻止handleScroll和cleanup保存错误的位置
                    isNavigatingToDetailRef.current = true;

                    // 保存当前位置（包含滚动位置）
                    // 必须在切换状态前保存，否则scrollContainerRef可能变空或高度变化
                    const currentScrollTop =
                      scrollContainerRef.current?.scrollTop || 0;
                    savePosition(offset, i, currentScrollTop);

                    setDetailIndex(i);
                    setCurrentIndex(i);
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
                          未收藏
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
                          已浏览
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          标记浏览
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
            <div className="mb-2">
              <span className="inline-block bg-orange-500 text-white text-xs px-2 py-1 rounded mr-2 align-middle">
                {currentQuestion.type === "SINGLE"
                  ? "单选题"
                  : currentQuestion.type === "MULTIPLE"
                  ? "多选题"
                  : "判断题"}
              </span>
              <span className="text-base font-medium align-middle">
                {currentQuestion.content}
              </span>
            </div>

            {currentQuestion.image && (
              <div className="mb-2">
                <img
                  src={currentQuestion.image}
                  alt="Question Image"
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}

            <div className="space-y-2">
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
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${optionStyle}`}
                    onClick={() =>
                      !isReciteMode && handleOptionSelect(opt.label)
                    }
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs border ${
                        isSelected || (shouldShowAnswer && isCorrect)
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-300 text-gray-500"
                      }`}
                    >
                      {opt.label}
                    </div>
                    <span className="flex-1 text-sm">{opt.value}</span>
                  </div>
                );
              })}
            </div>

            {(showAnswer || (viewMode === "list" && detailIndex !== null)) && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
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
      <footer className="bg-white p-2 border-t flex justify-between items-center">
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
                  savePosition(newOffset, 0, 0); // 切换页面时保存位置，重置滚动
                }}
                disabled={offset === 0}
              >
                上一页
              </Button>

              <Sheet open={isPageSheetOpen} onOpenChange={setIsPageSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium h-auto py-1 px-2"
                  >
                    {Math.floor(offset / limit) + 1}/
                    {Math.ceil(totalCount / limit)}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[50vh] rounded-t-xl">
                  <SheetHeader>
                    <SheetTitle className="p-0">选择页码</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 grid grid-cols-5 gap-3 overflow-y-auto max-h-[40vh] p-2">
                    {Array.from({ length: Math.ceil(totalCount / limit) }).map(
                      (_, i) => {
                        const pageNum = i + 1;
                        const isCurrent =
                          Math.floor(offset / limit) + 1 === pageNum;
                        const pageType = queryData?.pageTypes?.[i];
                        const typeText =
                          pageType === "SINGLE"
                            ? "单选"
                            : pageType === "MULTIPLE"
                            ? "多选"
                            : pageType === "JUDGE"
                            ? "判断"
                            : "";

                        return (
                          <Button
                            key={i}
                            variant={isCurrent ? "default" : "outline"}
                            className={`flex flex-col h-auto py-2 ${
                              isCurrent
                                ? "bg-orange-500 hover:bg-orange-600"
                                : ""
                            }`}
                            onClick={() => {
                              const newOffset = i * limit;
                              setOffset(newOffset);
                              savePosition(newOffset, 0, 0);
                              setIsPageSheetOpen(false);
                            }}
                          >
                            <span className="text-lg leading-none">
                              {pageNum}
                            </span>
                            {typeText && (
                              <span className="text-[10px] opacity-70 leading-none mt-1">
                                {typeText}
                              </span>
                            )}
                          </Button>
                        );
                      }
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!checkSubscription()) return;
                  const newOffset = offset + limit;
                  setOffset(newOffset);
                  savePosition(newOffset, 0, 0); // 切换页面时保存位置，重置滚动
                }}
                disabled={!hasMore}
              >
                下一页
              </Button>
            </div>
          </>
        ) : viewMode === "list" && detailIndex !== null ? (
          <div className="flex gap-2 w-full items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-col gap-1 h-auto py-2 px-2"
                onClick={handleCollect}
              >
                <Star
                  className={`w-5 h-5 ${
                    currentQuestion.isCollected
                      ? "fill-yellow-400 text-yellow-400"
                      : ""
                  }`}
                />
                <span className="text-[10px]">
                  {currentQuestion.isCollected ? "已收藏" : "未收藏"}
                </span>
              </Button>

              <Button
                variant="ghost"
                className="flex-col gap-1 h-auto py-2 px-2"
                onClick={() => toggleRecited(currentQuestion.id)}
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    currentQuestion.isRecited
                      ? "fill-green-500 text-green-500"
                      : ""
                  }`}
                />
                <span className="text-[10px]">
                  {currentQuestion.isRecited ? "已浏览" : "未浏览"}
                </span>
              </Button>
            </div>

            <div className="flex gap-2 flex-1 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecitePrev}
                disabled={currentIndex === 0 && offset === 0}
              >
                <ChevronLeft className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">上一题</span>
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600"
                onClick={handleReciteNext}
                disabled={!hasMore && currentIndex === questions.length - 1}
              >
                <span className="hidden sm:inline">下一题</span>
                <ChevronRight className="h-4 w-4 sm:hidden" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-0.5 sm:gap-2">
              {mode !== "mock" && (
                <Button
                  variant="ghost"
                  className="flex-col gap-1 h-auto py-0 sm:px-4"
                  onClick={() => setShowAnswer(!showAnswer)}
                >
                  <Eye className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs">答案</span>
                </Button>
              )}

              <Button
                variant="ghost"
                className="flex-col gap-1 h-auto py-0 sm:px-4"
                onClick={handleCollect}
              >
                <Star
                  className={`w-5 h-5 ${
                    currentQuestion.isCollected
                      ? "fill-yellow-400 text-yellow-400"
                      : ""
                  }`}
                />
                <span className="text-[10px] sm:text-xs">
                  {currentQuestion.isCollected ? "已收藏" : "未收藏"}
                </span>
              </Button>

              <Button
                variant="ghost"
                className="flex-col gap-1 h-auto py-0 sm:px-4"
                onClick={() => toggleRecited(currentQuestion.id)}
              >
                <Bookmark
                  className={`w-5 h-5 ${
                    currentQuestion.isRecited
                      ? "fill-green-500 text-green-500"
                      : ""
                  }`}
                />
                <span className="text-[10px] sm:text-xs">
                  {currentQuestion.isRecited ? "已浏览" : "未浏览"}
                </span>
              </Button>

              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex-col gap-1 h-auto py-2 px-1 sm:px-4"
                  >
                    <Grid className="w-5 h-5" />
                    <span className="text-[10px] sm:text-xs">答题卡</span>
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

            <div className="flex gap-2 flex-1 justify-end min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="shrink-0 px-2 sm:px-3"
              >
                <ChevronLeft className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">上一题</span>
              </Button>
              {mode === "mock" ? (
                currentIndex < questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="bg-orange-500 hover:bg-orange-600 shrink-0 px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">下一题</span>
                    <ChevronRight className="h-4 w-4 sm:hidden" />
                  </Button>
                ) : null
              ) : isSubmitted || showAnswer ? (
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-orange-500 hover:bg-orange-600 shrink-0 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">下一题</span>
                  <ChevronRight className="h-4 w-4 sm:hidden" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  className="bg-orange-500 hover:bg-orange-600 shrink-0 px-2 sm:px-3"
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
              <Label className="text-right w-20">题目数量</Label>
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
              <Label className="text-right w-20">出题顺序</Label>
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

      <Dialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>开通会员</DialogTitle>
            <DialogDescription>
              解锁所有题目和高级功能，仅需 9.9 元/2个月
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>解锁所有 2000+ 题目</li>
              <li>无限制查看答案解析</li>
              <li>专属错题本和收藏夹</li>
              <li>模拟考试功能</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubscriptionDialog(false)}
            >
              取消
            </Button>
            <Button onClick={handleSubscribe} disabled={isCheckingSubscription}>
              {isCheckingSubscription ? "处理中..." : "立即开通 (¥9.9)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
