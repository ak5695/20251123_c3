import type { NextConfig } from "next";
// @ts-expect-error next-pwa doesn't have type definitions
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
};

export default withPWA(nextConfig);
