"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Mail, Clock, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold">客服支持</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              联系我们
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">邮箱支持</h3>
                  <p className="text-sm text-blue-700">ji569514123@gmail.com</p>
                  <p className="text-xs text-blue-600">
                    我们会在48小时内回复您的邮件
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900">工作时间</h3>
                  <p className="text-sm text-green-700">
                    周一至周五 9:00-18:00
                  </p>
                  <p className="text-xs text-green-600">节假日可能延迟回复</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>常见问题</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium">如何开通会员？</h3>
                <p className="text-sm text-gray-600 mt-1">
                  点击首页的"开通会员"按钮，选择支付方式完成付款即可。支持微信支付、支付宝和银行卡。
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium">忘记密码怎么办？</h3>
                <p className="text-sm text-gray-600 mt-1">
                  请发送邮件至
                  ji569514123@gmail.com，提供您的注册邮箱，我们会协助您重置密码。
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium">如何申请退款？</h3>
                <p className="text-sm text-gray-600 mt-1">
                  购买后7天内可申请退款。请查看我们的
                  <a href="/refund" className="text-blue-500 hover:underline">
                    退款政策
                  </a>
                  了解详细条件。
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium">题目有错误怎么反馈？</h3>
                <p className="text-sm text-gray-600 mt-1">
                  请通过邮件告诉我们具体的题目内容和错误描述，我们会及时核实并修正。
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium">会员到期后数据会删除吗？</h3>
                <p className="text-sm text-gray-600 mt-1">
                  不会。您的学习记录、评论等数据会保留，续费后可继续使用。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>意见反馈</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              您的意见对我们很重要！如果您有任何建议或发现了问题，请通过以下方式联系我们：
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>邮箱：</strong>
                <a
                  href="mailto:ji569514123@gmail.com"
                  className="text-blue-500 hover:underline ml-1"
                >
                  ji569514123@gmail.com
                </a>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                请在邮件中详细描述问题或建议，我们会认真对待每一份反馈。
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
