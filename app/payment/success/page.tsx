"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "timeout">(
    "verifying"
  );
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 15; // 30 seconds timeout

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/subscription-status");
        if (res.ok) {
          const data = await res.json();
          if (data.isPaid) {
            setStatus("success");
            clearInterval(intervalId);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check status:", error);
      }

      attempts++;
      if (attempts >= maxAttempts) {
        setStatus("timeout");
        clearInterval(intervalId);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 2 seconds
    intervalId = setInterval(checkStatus, 2000);

    return () => clearInterval(intervalId);
  }, []);

  if (status === "verifying") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在确认支付结果...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
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
          <CardTitle
            className={`text-2xl ${
              status === "success" ? "text-green-600" : "text-orange-600"
            }`}
          >
            {status === "success" ? "支付成功！" : "支付处理中"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <div
              className={`text-6xl mb-4 ${
                status === "success" ? "text-green-500" : "text-orange-500"
              }`}
            >
              {status === "success" ? "✓" : "!"}
            </div>
            <p className="text-gray-600 mb-2">
              {status === "success"
                ? "恭喜您成功开通会员"
                : "我们已收到您的支付请求，系统正在处理中"}
            </p>
            <p className="text-sm text-gray-500">
              {status === "success"
                ? "现在您可以享受所有高级功能了！"
                : "请稍后在会员中心查看状态，通常会在几分钟内完成。"}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/")}
              className={`w-full ${
                status === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {status === "success" ? "开始学习" : "返回首页"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/subscription")}
              className="w-full"
            >
              查看会员信息
            </Button>
          </div>

          {sessionId && (
            <p className="text-xs text-gray-400 mt-4">
              订单号: {sessionId.slice(-10)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          加载中...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
