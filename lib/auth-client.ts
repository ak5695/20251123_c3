import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL, // the base url of your auth server
  fetchOptions: {
    // 禁用客户端缓存，确保每次都从服务器获取最新会话状态
    cache: "no-store",
  },
});
