"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { XCircle } from "lucide-react";

export default function CancelPage() {
  const router = useRouter();

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
          <CardTitle className="text-2xl text-gray-700">支付已取消</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <XCircle className="w-16 h-16 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-2">您取消了支付操作</p>
            <p className="text-sm text-gray-500">
              未扣除任何费用，您可以随时重新发起支付
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/subscription")}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              重新订阅
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
