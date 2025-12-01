"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  Crown,
  User,
  CalendarDays,
  Gift,
  Copy,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { vibrate } from "@/lib/utils";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  isPaid: boolean;
  subscriptionExpiresAt?: string;
}

export default function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const queryClient = useQueryClient(); // Add this
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");

  const { data: userProfile, isLoading: isProfileLoading } =
    useQuery<UserProfile>({
      queryKey: ["user-profile"],
      queryFn: async () => {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      },
      enabled: !!session,
    });

  // 获取推荐码
  const fetchReferralCode = async () => {
    try {
      const res = await fetch("/api/referral/code");
      if (res.ok) {
        const data = await res.json();
        setReferralCode(data.referralCode);
        setReferralLink(data.referralLink);
      }
    } catch (error) {
      console.error("Failed to fetch referral code:", error);
    }
  };

  const { data: stats = [], isLoading: isStatsLoading } = useQuery<
    CategoryStats[]
  >({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      console.log("[Dashboard] Fetching stats...");
      const res = await fetch("/api/dashboard-stats?t=" + Date.now()); // Prevent caching
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      console.log("[Dashboard] Stats received:", data);
      return data;
    },
    // enabled: !!session, // Removed to allow fetching stats for guests
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0, // 数据立即过期，确保每次都能刷新
  });

  // 每次进入页面都强制刷新数据
  useEffect(() => {
    console.log("[Dashboard] Mounted, invalidating stats query");
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }, [queryClient]);

  // 当页面获得焦点时，重新验证会话状态
  // 这样当用户在其他设备登录后，切回此页面时会检测到会话已失效
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && session) {
        // 重新获取会话状态
        authClient.getSession().then((result) => {
          if (!result.data) {
            // 会话已失效，显示提示并跳转到登录页
            toast.error("您的账号已在其他设备登录，当前设备已自动退出", {
              duration: 5000,
            });
            authClient.signOut().then(() => {
              router.push("/sign-in");
            });
          }
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session, router]);

  // 定期检查会话状态（每30秒检查一次）
  useEffect(() => {
    if (!session) return;

    const checkSession = async () => {
      const result = await authClient.getSession();
      if (!result.data) {
        toast.error("您的账号已在其他设备登录，当前设备已自动退出", {
          duration: 5000,
        });
        authClient.signOut().then(() => {
          router.push("/sign-in");
        });
      }
    };

    const interval = setInterval(checkSession, 30000); // 每30秒检查一次
    return () => clearInterval(interval);
  }, [session, router]);

  useEffect(() => {
    // Removed redirect to allow guest access
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const handleSubscribe = async () => {
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
    }
  };

  const navigateToQuiz = (category: string, filterType: string) => {
    // if (!session) {
    //   router.push("/sign-in");
    //   return;
    // }
    const params = new URLSearchParams();
    if (category !== "全部") {
      params.set("category", category);
    }
    params.set("filterType", filterType);
    router.push(`/quiz/category?${params.toString()}`);
  };

  if (isPending || isStatsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // if (!session) return null; // Removed to allow guest access

  const defaultStats: CategoryStats[] = [
    {
      category: "全部",
      total: 0,
      unanswered: 0,
      correct: 0,
      incorrect: 0,
      collected: 0,
      viewed: 0,
      unviewed: 0,
    },
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;
  const allStats =
    displayStats.find((s) => s.category === "全部") || defaultStats[0];
  const categoryStats = displayStats.filter((s) => s.category !== "全部");

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
      onClick={() => {
        vibrate();
        onClick();
      }}
      className={`cursor-pointer flex flex-col items-center justify-center p-1 rounded hover:bg-gray-50 transition-all active:scale-90 w-full ${bgColor} bg-opacity-20 hover:bg-opacity-30`}
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
      label: "我的评论",
      icon: PenTool,
      color: "text-orange-500",
      bg: "bg-orange-100",
      href: "/my-comments",
    },
    {
      label: "每日统计",
      icon: CalendarDays,
      color: "text-teal-500",
      bg: "bg-teal-100",
      href: "/daily-stats",
    },
  ];

  const userInitial = session?.user
    ? (session.user.name || session.user.email || "U").charAt(0).toUpperCase()
    : "G";
  const isPaid = userProfile?.isPaid || false;

  const handleRestrictedAction = (href: string) => {
    vibrate();
    if (!session) {
      router.push("/sign-in");
      return;
    }
    if (!isPaid) {
      setShowSubscriptionDialog(true);
    } else {
      router.push(href);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-3 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="C3安考宝典"
            width={40}
            height={40}
            className="size-10 object-contain"
            priority={false}
          />
          <h1 className="text-lg font-bold">广东C3安考宝典</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* 邀请有礼按钮 - 所有用户可见 */}
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-1 px-2"
            onClick={() => {
              vibrate();
              if (session && isPaid) {
                fetchReferralCode();
              }
              setShowReferralDialog(true);
            }}
          >
            <Gift className="w-4 h-4" />
            <span className="text-xs">邀请有礼</span>
          </Button>

          {session ? (
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                      <AvatarImage src={session.user.image || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    {isPaid && (
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5 border-2 border-white">
                        <Crown className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="p-4 flex flex-col items-center gap-3 bg-gradient-to-b from-gray-50 to-white">
                  <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <div className="font-bold text-lg truncate max-w-[200px]">
                      {session.user.name || "用户"}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                      {session.user.email}
                    </div>
                  </div>

                  {isPaid ? (
                    <div className="flex flex-col items-center gap-1 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-100">
                      <div className="flex items-center gap-1 text-yellow-700 font-bold text-sm">
                        <Crown className="w-4 h-4 fill-yellow-700" />
                        <span>尊贵会员</span>
                      </div>
                      {userProfile?.subscriptionExpiresAt && (
                        <div className="text-[10px] text-yellow-600/80">
                          到期:{" "}
                          {new Date(
                            userProfile.subscriptionExpiresAt
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        普通用户
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-none shadow-md"
                        onClick={handleSubscribe}
                      >
                        <Crown className="w-4 h-4 mr-1" />
                        升级会员
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* 推荐好友按钮 - 仅付费用户可见 */}
                {isPaid && (
                  <>
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        onClick={() => {
                          fetchReferralCode();
                          setShowReferralDialog(true);
                        }}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        推荐好友得会员
                      </Button>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="p-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Link href="/sign-in">
              <Button size="sm" variant="default">
                登录 / 注册
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="p-2 space-y-2">
        {/* Top Actions */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {topActions.map((action) => (
            <Card
              key={action.label}
              className="cursor-pointer hover:shadow-md transition-all active:scale-90 border-none shadow-sm py-2"
              onClick={() => handleRestrictedAction(action.href)}
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

      <Dialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-yellow-600">
              <Crown className="w-6 h-6" />
              会员专享功能
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              该功能仅限会员使用。升级会员即可解锁.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowSubscriptionDialog(false)}
              className="w-full sm:w-auto"
            >
              暂不需要
            </Button>
            <Button
              onClick={() => {
                setShowSubscriptionDialog(false);
                handleSubscribe();
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-none"
            >
              立即升级
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 推荐好友对话框 */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              邀请有礼
            </DialogTitle>
            <DialogDescription className="pt-2">
              分享您的专属推荐码，好友注册并成为会员后，您和好友各得{" "}
              <span className="font-bold text-purple-600">5天会员</span>！
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 根据用户状态显示不同内容 */}
            {!session ? (
              // 未登录用户
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-gray-400 mb-2">🎁</div>
                  <div className="text-sm text-gray-600">
                    注册并登录,获取您的专属推荐码
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    setShowReferralDialog(false);
                    router.push("/sign-up");
                  }}
                >
                  立即注册
                </Button>
              </div>
            ) : !isPaid ? (
              // 已登录但非会员
              <div className="space-y-4">
                <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                  <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-700 font-medium">
                    成为会员后即可推荐好友
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    开通会员，立即获取专属推荐码
                  </div>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                  onClick={() => {
                    setShowReferralDialog(false);
                    handleSubscribe();
                  }}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  立即开通会员
                </Button>
              </div>
            ) : (
              // 已登录且是会员
              <>
                {/* 推荐码显示 */}
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-500 mb-2">
                    您的专属推荐码
                  </div>
                  <div className="text-3xl font-bold text-purple-600 tracking-widest">
                    {referralCode || "加载中..."}
                  </div>
                </div>

                {/* 复制按钮组 */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(referralCode);
                      toast.success("推荐码已复制");
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制推荐码
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(referralLink);
                      toast.success("推荐链接已复制");
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    复制链接
                  </Button>
                </div>
              </>
            )}

            {/* 规则说明 - 所有用户可见 */}
            <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-700 mb-1">推荐规则：</div>
              <div>• 成为会员后可获取专属推荐码</div>
              <div>
                • 好友通过您的链接或推荐码注册并成为会员,双方各得5天会员
              </div>
              <div>• 推荐人数无上限，多推多得</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
