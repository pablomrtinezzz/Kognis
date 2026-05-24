import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Disable in dev to avoid caching issues while coding
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Silences Next.js 16's warning about a webpack config alongside Turbopack dev.
  turbopack: {},
  experimental: {
    // Next.js 16 only creates .next/dev on startup when this flag is set.
    // Without it, Turbopack's SST cache tries to write before the directory
    // exists, crashing the first compilation cold-start.
    lockDistDir: true,
  },
};

export default withPWA(nextConfig);
