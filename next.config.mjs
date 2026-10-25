/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // "standalone" makes `next build` emit a self-contained server in
  // .next/standalone, so the Docker image only carries what it needs to run.
  // Vercel ignores this setting, so the existing deployment is unaffected.
  output: "standalone",
};

export default nextConfig;
