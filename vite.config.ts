import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The public site: the landing page at the root, plus /offerings (coaching).
// Each entry HTML keeps its folder, so offerings/index.html serves at /offerings.
// The private Script Studio builds separately — see vite.studio.config.ts.
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        offerings: resolve(__dirname, "offerings/index.html"),
      },
    },
  },
});
