import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server's HMR WebSocket + dev-only endpoints from non-localhost
  // origins (we proxy via nginx at aduanasync.com.br). Without this, browser WS
  // upgrades fail because Next refuses cross-origin handshakes in dev.
  allowedDevOrigins: ["aduanasync.com.br", "www.aduanasync.com.br"],
};

export default nextConfig;
