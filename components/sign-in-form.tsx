"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authClient.signIn.email(
        {
          email,
          password,
          callbackURL: "/",
        },
        {
          onRequest: () => {
            setLoading(true);
          },
          onSuccess: () => {
            toast.success("登录成功");
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
        <CardTitle className="text-2xl">登录</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">密码</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-500 hover:underline"
              >
                忘记密码?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full mt-8" type="submit" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
          <div className="text-sm text-center text-gray-500 mt-5">
            还没有账号?{" "}
            <Link href="/sign-up" className="text-blue-500 hover:underline">
              去注册
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
