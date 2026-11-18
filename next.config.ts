import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Telegram bot library runs in the Node process; keep it out of the bundle.
  serverExternalPackages: ["grammy"],
};

export default nextConfig;
