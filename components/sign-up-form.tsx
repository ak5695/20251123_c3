"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Gift } from "lucide-react";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referrerName, setReferrerName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 从 URL 获取推荐码
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  // 验证推荐码
  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 6) {
      setReferralValid(null);
      setReferrerName("");
      return;
    }

    try {
      const res = await fetch("/api/referral/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setReferralValid(data.valid);
      setReferrerName(data.referrerName || "");
    } catch (error) {
      setReferralValid(false);
    }
  };

  const handleReferralCodeChange = (value: string) => {
    const code = value.toUpperCase();
    setReferralCode(code);
    if (code.length >= 6) {
      validateReferralCode(code);
    } else {
      setReferralValid(null);
      setReferrerName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("密码必须是至少8个字符");
      return;
    }
    setLoading(true);
    try {
      await authClient.signUp.email(
        {
          email,
          password,
          name,
          callbackURL: "/",
        },
        {
          onRequest: () => {
            setLoading(true);
          },
          onSuccess: async () => {
            // 如果有有效的推荐码，绑定推荐关系
            if (referralValid && referralCode) {
              try {
                await fetch("/api/referral/bind", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ referralCode }),
                });
              } catch (err) {
                console.error("Failed to bind referral:", err);
              }
            }
            toast.success("账户创建成功");
            router.push("/");
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
            setLoading(false);
          },
        }
      );
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="Logo"
            width={80}
            height={80}
            className="rounded-lg"
          />
        </div>
        <CardTitle className="text-2xl">注册</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">名字</Label>
            <Input
              id="name"
              placeholder="王二"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {/* 推荐码输入框 */}
          <div className="grid gap-2">
            <Label htmlFor="referralCode" className="flex items-center gap-1">
              <Gift className="w-4 h-4" />
              推荐码（选填）
            </Label>
            <div className="relative">
              <Input
                id="referralCode"
                placeholder="输入推荐码可获得额外5天会员"
                value={referralCode}
                onChange={(e) => handleReferralCodeChange(e.target.value)}
                maxLength={6}
                className={
                  referralValid === true
                    ? "border-green-500 pr-10"
                    : referralValid === false
                    ? "border-red-500"
                    : ""
                }
              />
              {referralValid === true && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
            {referralValid === true && referrerName && (
              <p className="text-xs text-green-600">
                ✓ 推荐人: {referrerName}，付费后双方各获得5天会员
              </p>
            )}
            {referralValid === false && referralCode.length >= 6 && (
              <p className="text-xs text-red-500">推荐码无效</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full mt-6" type="submit" disabled={loading}>
            {loading ? "创建账户中..." : "创建账户"}
          </Button>
          <div className="text-sm text-center text-gray-500 mt-5">
            已有账号?{" "}
            <Link href="/sign-in" className="text-blue-500 hover:underline">
              去登录
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
