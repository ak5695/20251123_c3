import { SignUpForm } from "@/components/sign-up-form";
import { Suspense } from "react";

function SignUpContent() {
  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <SignUpForm />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center px-4">
          <div className="animate-pulse">加载中...</div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
