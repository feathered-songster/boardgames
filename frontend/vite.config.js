import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

export default defineConfig({
  // The version shown in the footer comes from package.json, which release-please bumps.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  test: { environment: "node" },
});
