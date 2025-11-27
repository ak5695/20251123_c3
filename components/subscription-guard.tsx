"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SubscriptionGuard({
  children,
  fallback,
}: SubscriptionGuardProps) {
  const { status, loading, error } = useSubscription();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">检查会员状态...</p>
        </div>
      </div>
    );
  }

  if (error || !status?.isPaid) {
    if (fallback) {
      return <>{fallback}</>;
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
            <CardTitle className="text-2xl">需要会员权限</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              此功能需要会员权限才能使用，请先开通会员
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/subscription")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                开通会员
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full"
              >
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
