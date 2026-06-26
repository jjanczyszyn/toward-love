import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Multi-page build:
//  - index.html      → the public landing page (toward.love)
//  - scripts.html    → the private, login-gated script studio (script.toward.love
//                      via DNS, or toward.love/scripts.html on the same Pages site)
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: r("./index.html"),
        scripts: r("./scripts.html"),
      },
    },
  },
});
