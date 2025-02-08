import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

const httpsConfig = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

export default defineConfig({
  plugins: [react()],
  server: {
    https: httpsConfig,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
      },
    },
    host: "localhost",
    port: 5173,
  },
});
