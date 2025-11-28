import { betterAuth, type User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db"; // Adjust path if needed
import * as schema from "./db/schema";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Temporarily disable to allow login
  },
  emailVerification: {
    enabled: true,
    sendOnSignUp: true,
    sendVerificationEmail: async (
      { user, url, token }: { user: User; url: string; token: string },
      request?: Request
    ) => {
      const { error } = await resend.emails.send({
        from: "广东C3安考宝典 <noreply@c3.dufran.cn>",
        to: user.email,
        subject: "验证您的邮箱",
        html: `<p>请点击以下链接验证您的邮箱：<a href="${url}">${url}</a></p>`,
      });
      if (error) {
        console.error("Error sending verification email:", error);
      }
    },
  },
  passwordReset: {
    enabled: true,
    sendResetPasswordEmail: async (
      { user, url, token }: { user: User; url: string; token: string },
      request?: Request
    ) => {
      const { error } = await resend.emails.send({
        from: "广东C3安考宝典 <noreply@c3.dufran.cn>",
        to: user.email,
        subject: "重置您的密码",
        html: `<p>请点击以下链接重置您的密码：<a href="${url}">${url}</a></p>`,
      });
      if (error) {
        console.error("Error sending password reset email:", error);
      }
    },
  },
  trustedOrigins: [
    "https://c3.dufran.cn",
    "https://www.c3.dufran.cn",
    "http://localhost:3000",
  ],
});
