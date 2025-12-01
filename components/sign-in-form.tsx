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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();

  // 实际执行登录的函数
  const performLogin = async () => {
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
          onSuccess: async () => {
            // 登录成功后，撤销该账户在其他设备上的会话
            try {
              await fetch("/api/auth/revoke-other-sessions", {
                method: "POST",
              });
            } catch (err) {
              console.error("Failed to revoke other sessions:", err);
            }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 先检查是否有其他活跃会话
      const checkRes = await fetch("/api/auth/check-active-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const checkData = await checkRes.json();

      if (checkData.hasActiveSessions) {
        // 有其他活跃会话，显示确认对话框
        setLoading(false);
        setShowConfirmDialog(true);
      } else {
        // 没有其他会话，直接登录
        await performLogin();
      }
    } catch (error) {
      console.error(error);
      // 检查失败时，继续正常登录流程
      await performLogin();
    }
  };

  const handleConfirmLogin = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    await performLogin();
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

      {/* 确认在新设备登录的对话框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>账号已在其他设备登录</AlertDialogTitle>
            <AlertDialogDescription>
              检测到您的账号当前已在其他设备上登录。如果继续登录，其他设备将被自动退出登录。
              <br />
              <br />
              确定要在此设备上登录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLoading(false)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogin}>
              确认登录
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
