"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // Better Auth usually sends token as query param? Or is it part of the hash?
  // Actually, Better Auth default link is usually /reset-password?token=...
  // But let's check if there is an error query param too.
  const error = searchParams.get("error");

  if (error) {
    return (
      <div className="text-center text-red-500">
        无效或过期的链接。请重新申请重置密码。
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center text-red-500">
        缺少验证令牌。请检查链接是否完整。
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authClient.resetPassword({
        newPassword: password,
        token, // Pass the token explicitly if needed, or let it auto-detect if supported?
        // authClient.resetPassword signature usually takes { newPassword, token }
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("密码重置成功，请登录");
        router.push("/sign-in");
      }
    } catch (error) {
      toast.error("重置失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">新密码</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">确认新密码</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "重置中..." : "重置密码"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">重置密码</CardTitle>
          <CardDescription>请输入您的新密码。</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex justify-center">
                <Loader2 className="animate-spin" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
