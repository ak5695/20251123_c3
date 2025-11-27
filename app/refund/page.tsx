"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RefundPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold">退款政策</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>C3安考宝典退款政策</CardTitle>
            <p className="text-sm text-gray-600">
              最后更新时间：2025年11月26日
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">1. 退款期限</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>1.1 7天无理由退款</strong>
                </p>
                <p>自购买会员之日起7天内，您可以无理由申请全额退款，前提是：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>未超过50道题的练习记录</li>
                  <li>未使用模拟考试功能</li>
                  <li>账户无违规行为</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. 特殊情况退款</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>2.1 技术问题</strong>
                </p>
                <p>如遇以下技术问题，我们将提供全额退款：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>服务长期无法访问（超过24小时）</li>
                  <li>功能严重缺陷影响正常使用</li>
                  <li>数据丢失且无法恢复</li>
                </ul>

                <p className="mt-4">
                  <strong>2.2 重复购买</strong>
                </p>
                <p>因系统错误导致的重复扣费，我们将立即退还多收取的费用。</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. 不予退款情况</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>以下情况我们不提供退款：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>会员期限已使用超过50%</li>
                  <li>违反使用条款被封号</li>
                  <li>因个人原因（如考试通过、不再需要等）</li>
                  <li>已享受过一次退款服务的用户</li>
                  <li>使用第三方软件作弊被发现</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. 退款流程</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>4.1 申请流程</strong>
                </p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>发送邮件至：ji569514123@gmail.com</li>
                  <li>邮件标题：【退款申请】+ 您的注册邮箱</li>
                  <li>
                    邮件内容包含：
                    <ul className="list-disc list-inside ml-8 mt-2 space-y-1">
                      <li>购买时间和订单号（如有）</li>
                      <li>退款原因详细说明</li>
                      <li>注册邮箱和用户名</li>
                    </ul>
                  </li>
                </ol>

                <p className="mt-4">
                  <strong>4.2 处理时间</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>我们将在收到申请后48小时内回复</li>
                  <li>审核通过后3-5个工作日完成退款</li>
                  <li>退款将原路返回至您的支付账户</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. 部分退款</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>在某些情况下，我们可能提供部分退款：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>会员期已使用不足30%且有合理原因</li>
                  <li>服务中断超过3天但未达到全额退款标准</li>
                  <li>功能缺陷影响部分使用体验</li>
                </ul>
                <p>部分退款金额将根据具体使用情况和影响程度确定。</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. 争议解决</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>如果您对退款决定有异议：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>可在收到回复后7天内提出申诉</li>
                  <li>提供更详细的证据和说明</li>
                  <li>我们将安排专人重新审核</li>
                  <li>最终决定将在申诉后3个工作日内给出</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. 联系方式</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>退款相关问题请联系：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong>邮箱：</strong>ji569514123@gmail.com
                  </li>
                  <li>
                    <strong>工作时间：</strong>周一至周五 9:00-18:00
                  </li>
                  <li>
                    <strong>回复时间：</strong>48小时内
                  </li>
                </ul>
                <p className="bg-blue-50 p-3 rounded-lg mt-4">
                  <strong>温馨提示：</strong>
                  为了更好地为您服务，建议在购买前仔细了解我们的服务内容。如有任何疑问，欢迎在购买前咨询客服。
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
