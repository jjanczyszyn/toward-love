import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Builds ONLY the private Script Studio (script.toward.love) into dist-studio/.
// The studio is deployed to its own GitHub Pages repo (jjanczyszyn/toward-love-script)
// by scripts/deploy-studio.sh. Bake the API endpoint in via VITE_SCRIPTS_API.
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    outDir: "dist-studio",
    rollupOptions: {
      input: { scripts: fileURLToPath(new URL("./scripts.html", import.meta.url)) },
    },
  },
});
