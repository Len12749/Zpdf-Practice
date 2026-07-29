import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist", "bcryptjs"],
  // 避免把 .tmp 运行时目录打进 NFT 追踪
  outputFileTracingExcludes: {
    "*": ["./.tmp/**/*", "./drizzle/**/*", "./supabase/**/*"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
