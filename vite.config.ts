import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The public site: the landing page at the root, plus /offerings (coaching).
// Each entry HTML keeps its folder, so offerings/index.html serves at /offerings.
// Input paths are relative to the project root (Vite resolves them from there).
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        offerings: "offerings/index.html",
        // Deep links: each offering has a static entry so /offerings/<slug>
        // resolves on GitHub Pages; the app reads the path to open it.
        mastermind: "offerings/calling-in-the-one-mastermind/index.html",
        individual: "offerings/individual-coaching/index.html",
        couples: "offerings/couples-coaching/index.html",
      },
    },
  },
});
