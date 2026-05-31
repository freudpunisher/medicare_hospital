/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Required for Docker: bundles the server into a standalone folder
  // that can run with just `node server.js` without node_modules
  output: 'standalone',
}

export default nextConfig
