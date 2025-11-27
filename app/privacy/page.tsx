"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold">隐私政策</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>C3安考宝典隐私政策</CardTitle>
            <p className="text-sm text-gray-600">
              最后更新时间：2024年11月26日
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">1. 信息收集</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>1.1 个人信息</strong>
                </p>
                <p>我们收集您提供的以下信息：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>注册时提供的姓名和邮箱地址</li>
                  <li>
                    支付信息（通过Stripe安全处理，我们不存储完整的支付卡信息）
                  </li>
                  <li>学习进度和答题记录</li>
                  <li>设备信息和IP地址</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. 信息使用</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>我们使用收集的信息用于：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>提供和改善我们的服务</li>
                  <li>处理支付和管理您的账户</li>
                  <li>发送重要的服务通知</li>
                  <li>分析使用情况以优化用户体验</li>
                  <li>防止欺诈和保护服务安全</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. 信息共享</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>我们不会出售、交易或转让您的个人信息给第三方，除非：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>获得您的明确同意</li>
                  <li>与可信的服务提供商合作（如Stripe支付处理）</li>
                  <li>法律要求或保护合法权益</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. 数据安全</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>我们采取以下措施保护您的信息：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>使用SSL加密传输数据</li>
                  <li>定期更新安全措施</li>
                  <li>限制员工访问个人信息</li>
                  <li>使用安全的云存储服务</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. 您的权利</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>您有权：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>访问和更新您的个人信息</li>
                  <li>请求删除您的账户和数据</li>
                  <li>选择退出某些数据收集</li>
                  <li>获得数据处理的详细信息</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. Cookie使用</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>我们使用Cookie来：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>保持您的登录状态</li>
                  <li>记住您的偏好设置</li>
                  <li>分析网站使用情况</li>
                  <li>提供个性化体验</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. 联系我们</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>如果您对本隐私政策有任何疑问，请联系我们：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>邮箱：ji569514123@gmail.com</li>
                  <li>我们将在收到您的询问后48小时内回复</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">8. 政策更新</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  我们可能会不时更新本隐私政策。重大更改时，我们会通过邮件或应用内通知告知您。继续使用我们的服务即表示您同意更新后的政策。
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
