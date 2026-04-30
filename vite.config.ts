import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || "";

if (process.env.NODE_ENV === "production" && !GEMINI_API_KEY) {
  console.warn(
    "⚠️  Warning: VITE_GEMINI_API_KEY is not set. The app will fail at runtime if this is not configured.",
  );
}

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    define: {
      "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(GEMINI_API_KEY),
      "import.meta.env.BUILD_TIME": JSON.stringify(new Date().toISOString()),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
  };
});
