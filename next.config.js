const isGitHubPages = process.env.GITHUB_ACTIONS === "true" || process.env.DEPLOY_TARGET === "github-pages";
/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isGitHubPages ? "/tlabel-web" : "",
  assetPrefix: isGitHubPages ? "/tlabel-web" : "",
};
module.exports = nextConfig;
