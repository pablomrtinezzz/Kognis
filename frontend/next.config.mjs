import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  experimental: {
    // Next.js 16 only creates .next/dev on startup when this flag is set.
    // Without it, Turbopack's SST cache tries to write before the directory
    // exists, crashing the first compilation cold-start.
    lockDistDir: true,
  },
};

export default withPWA(nextConfig);
