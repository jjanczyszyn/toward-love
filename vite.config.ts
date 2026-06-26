import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The public landing page, served at the toward.love root.
// The private Script Studio builds separately — see vite.studio.config.ts.
export default defineConfig({
  base: "/",
  plugins: [react()],
});
