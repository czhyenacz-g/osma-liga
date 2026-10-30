import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "./"),
  async redirects() {
    // Pracovní verze homepage (/demo, /demo-1) se staly veřejnou "/".
    return [
      { source: "/demo", destination: "/", permanent: false },
      { source: "/demo-1", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
