import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages 部署需要设置 basePath 为仓库名
  basePath: isProd ? '/tlabel-web' : '',
  // 确保静态资源路径正确
  assetPrefix: isProd ? '/tlabel-web' : '',
};

export default nextConfig;
