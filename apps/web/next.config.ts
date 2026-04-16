import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const monorepoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

const nextConfig: NextConfig = {
  transpilePackages: ["@privacy-diff/shared"],
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
