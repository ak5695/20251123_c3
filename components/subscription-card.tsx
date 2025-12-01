"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface SubscriptionStatus {
  isPaid: boolean;
  subscriptionExpiresAt: string | null;
}

export function SubscriptionCard() {
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const router = useRouter();

  // 检查用户当前订阅状态
  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/subscription-status");
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const handleSubscribe = async () => {
    if (loading) return;

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      toast.error("支付系统未配置，请联系管理员");
      return;
    }

    setLoading(true);
    try {
      // 创建 checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { url } = await response.json();

      // 重定向到 Stripe Checkout URL
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("支付初始化失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (subscriptionStatus?.isPaid) {
    const expirationDate = subscriptionStatus.subscriptionExpiresAt
      ? new Date(subscriptionStatus.subscriptionExpiresAt).toLocaleDateString(
          "zh-CN"
        )
      : "未知";

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="C3安考宝典"
                width={80}
                height={80}
                className="rounded-lg"
              />
            </div>
            <CardTitle className="text-2xl text-green-600">
              会员已激活
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              您已是会员用户，享受所有功能权限
            </p>
            <p className="text-sm text-gray-500 mb-6">
              到期时间：{expirationDate}
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              开始学习
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="C3安考宝典"
              width={80}
              height={80}
              className="rounded-lg"
            />
          </div>
          <CardTitle className="text-2xl">升级为会员</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">会员特权</h3>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  无限制刷题练习
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  错题收藏功能
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  学习记录查看
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  模拟考试功能
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  笔记功能
                </li>
              </ul>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                ￥12.8
              </div>
              <div className="text-sm text-gray-500">
                两月会员 / 2个月有效期
              </div>
            </div>

            <div className="text-xs text-gray-400 text-center">
              支持微信支付、支付宝、银行卡等多种支付方式
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "处理中..." : "立即开通会员"}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              点击开通即表示同意
              <a href="/terms" className="text-blue-500 hover:underline mx-1">
                服务条款
              </a>
              和
              <a href="/privacy" className="text-blue-500 hover:underline mx-1">
                隐私政策
              </a>
            </p>

            <div className="flex justify-center space-x-4 text-xs text-gray-400">
              <a href="/refund" className="hover:text-blue-500 hover:underline">
                退款政策
              </a>
              <span>|</span>
              <a
                href="mailto:ji569514123@gmail.com"
                className="hover:text-blue-500 hover:underline"
              >
                联系客服
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
