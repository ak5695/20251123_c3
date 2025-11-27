"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          返回首页
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>隐私政策</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              我们非常重视您的隐私保护。本隐私政策旨在向您说明我们如何收集、使用和保护您的个人信息。
            </p>

            <h3 className="font-bold text-base mt-4">1. 信息收集</h3>
            <p>
              我们仅收集您在使用本应用时主动提供的必要信息，例如注册账号时使用的手机号或邮箱，以及您的答题记录和收藏数据。
            </p>

            <h3 className="font-bold text-base mt-4">2. 信息使用</h3>
            <p>
              收集的信息仅用于为您提供个性化的学习服务，如同步您的学习进度、错题记录等。我们不会将您的个人信息出售或分享给第三方。
            </p>

            <h3 className="font-bold text-base mt-4">3. 数据安全</h3>
            <p>
              我们采取合理的技术手段保护您的数据安全，防止数据泄露、丢失或被滥用。
            </p>

            <h3 className="font-bold text-base mt-4">4. 变更通知</h3>
            <p>如果我们更新隐私政策，将在本页面发布通知。</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
