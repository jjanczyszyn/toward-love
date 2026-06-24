import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served at the toward.love root.
export default defineConfig({
  base: "/",
  plugins: [react()],
});
