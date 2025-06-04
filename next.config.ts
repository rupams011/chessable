import type { NextConfig } from "next";

const isGitLab = process.env.GITLAB_PAGES === 'true';
const repoName = 'chessable'; // Set this to your repo name

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  basePath: isGitLab ? `/${repoName}` : '',
  assetPrefix: isGitLab ? `/${repoName}/` : '',
};

export default nextConfig;
