/** @type {import('next').NextConfig} */
import path from 'path';

const nextConfig = {
  /* config options here */
  turbopack: {
    root: path.resolve(process.cwd(), '..'),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'steamcdn-a.akamaihd.net' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.steamstatic.com' },
      { protocol: 'https', hostname: 'images.igdb.com' },
      { protocol: 'https', hostname: 'media.rawg.io' },
    ],
  },
};


export default nextConfig;
