/** @type {import('next').NextConfig} */
import path from 'path';

const nextConfig = {
  /* config options here */
  experimental: {
    turbopack: {
      root: path.join(process.cwd(), '../'),
    },
  },
};

export default nextConfig;
