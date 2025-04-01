import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: process.env.NODE_ENV === "development"
      ? {
          "/api": {
            target: process.env.VITE_API_URL || "http://localhost:8000",
            changeOrigin: true,
            secure: false,
          },
        }
      : undefined,
    port: process.env.PORT || 5173,
  },
});