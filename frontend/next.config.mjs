import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: { root: path.resolve('.') },
  allowedDevOrigins: ['10.32.134.144'],

};

export default nextConfig;