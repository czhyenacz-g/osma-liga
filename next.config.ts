import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "./"),
  // Prisma Client must not be bundled by Next.js — it uses native binaries
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
