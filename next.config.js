/** @type {import('next').NextConfig} */
// 使用 GITHUB_ACTIONS 或 DEPLOY_TARGET 判断是否为 GitHub Pages 部署
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true' || process.env.DEPLOY_TARGET === 'github-pages';

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages 部署需要设置 basePath 为仓库名
  basePath: isGitHubPages ? '/tlabel-web' : '',
  // 确保静态资源路径正确
  assetPrefix: isGitHubPages ? '/tlabel-web' : '',
};

module.exports = nextConfig;
