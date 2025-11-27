"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 数据在 5 分钟内被认为是新鲜的，不会重新请求
            staleTime: 5 * 60 * 1000,
            // 缓存保留 30 分钟
            gcTime: 30 * 60 * 1000,
            // 窗口聚焦时不重新请求（为了保持阅读位置稳定）
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
