"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // 简单延迟模拟验证过程
    const timer = setTimeout(() => {
      setVerifying(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">验证支付状态...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.jpg"
              alt="C3安考宝典"
              width={80}
              height={80}
              className="rounded-lg"
            />
          </div>
          <CardTitle className="text-2xl text-green-600">支付成功！</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <div className="text-6xl text-green-500 mb-4">✓</div>
            <p className="text-gray-600 mb-2">恭喜您成功开通会员</p>
            <p className="text-sm text-gray-500">
              现在您可以享受所有高级功能了！
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              开始学习
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
