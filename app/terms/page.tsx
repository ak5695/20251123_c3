"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold">服务条款</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>C3安考宝典服务条款</CardTitle>
            <p className="text-sm text-gray-600">
              最后更新时间：2024年11月26日
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">1. 服务简介</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  C3安考宝典是一个专为C3安全员考试设计的在线学习平台。通过注册和使用我们的服务，您同意遵守以下条款。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. 账户注册</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>2.1 注册要求</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>您必须年满18周岁或在监护人同意下使用</li>
                  <li>提供真实、准确的注册信息</li>
                  <li>保护好您的账户密码</li>
                  <li>每个邮箱只能注册一个账户</li>
                </ul>

                <p className="mt-4">
                  <strong>2.2 账户责任</strong>
                </p>
                <p>
                  您对通过您的账户进行的所有活动负责，包括但不限于学习记录、支付行为等。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. 会员服务</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>3.1 服务内容</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>无限制练习题目</li>
                  <li>错题收藏和强化练习</li>
                  <li>学习记录和进度跟踪</li>
                  <li>模拟考试功能</li>
                  <li>学习笔记功能</li>
                </ul>

                <p className="mt-4">
                  <strong>3.2 服务期限</strong>
                </p>
                <p>
                  会员服务有效期为购买之日起2个月，到期后需重新购买以继续享受会员权益。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. 用户行为规范</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>4.1 禁止行为</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>使用技术手段破解或绕过付费限制</li>
                  <li>恶意刷题或使用自动化软件</li>
                  <li>与他人共享账户</li>
                  <li>复制、传播或出售我们的题目内容</li>
                  <li>进行任何可能损害服务安全的行为</li>
                </ul>

                <p className="mt-4">
                  <strong>4.2 违规处理</strong>
                </p>
                <p>发现违规行为，我们有权：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>警告或暂停账户</li>
                  <li>永久封禁账户</li>
                  <li>拒绝退款</li>
                  <li>追究法律责任</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. 知识产权</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>本平台的所有内容，包括但不限于：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>题目内容和解析</li>
                  <li>软件代码和设计</li>
                  <li>商标和品牌标识</li>
                  <li>用户界面和交互设计</li>
                </ul>
                <p>
                  均受知识产权法保护。未经许可，您不得复制、修改、传播或用于商业用途。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. 免责声明</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>6.1 服务可用性</strong>
                </p>
                <p>
                  我们努力保证服务的可用性，但不承诺100%无中断服务。维护期间可能出现短暂服务中断。
                </p>

                <p className="mt-4">
                  <strong>6.2 学习效果</strong>
                </p>
                <p>
                  本平台提供学习工具和资源，但不保证您一定能通过考试。学习效果取决于个人努力和其他因素。
                </p>

                <p className="mt-4">
                  <strong>6.3 内容准确性</strong>
                </p>
                <p>
                  我们努力确保题目和解析的准确性，但不对因内容错误导致的损失承担责任。如发现错误，请及时联系我们。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. 支付条款</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>7.1 支付方式</strong>
                </p>
                <p>
                  我们通过Stripe处理支付，支持多种支付方式。所有支付信息均经过加密保护。
                </p>

                <p className="mt-4">
                  <strong>7.2 价格政策</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>当前价格：两个月会员9.9元人民币</li>
                  <li>价格可能根据市场情况调整</li>
                  <li>已购买的会员不受价格调整影响</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">8. 服务变更</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  我们保留随时修改、暂停或终止服务的权利。重大变更将提前通知用户。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">9. 联系我们</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>如有任何问题或建议，请联系：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong>邮箱：</strong>ji569514123@gmail.com
                  </li>
                  <li>
                    <strong>响应时间：</strong>48小时内
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">10. 条款生效</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  本条款自您注册账户或使用我们的服务时生效。我们可能会更新这些条款，更新后的条款将在网站上公布。
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
