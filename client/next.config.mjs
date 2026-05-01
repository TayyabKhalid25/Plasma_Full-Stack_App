/** @type {import('next').NextConfig} */
import path from 'path';

const nextConfig = {
  /* config options here */
  turbopack: {
    root: path.resolve(process.cwd(), '..'),
  },
};


export default nextConfig;
