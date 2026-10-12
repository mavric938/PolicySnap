import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.0.104', '192.168.1.*', '192.168.0.*', 'localhost', '127.0.0.1'],
};

export default nextConfig;
