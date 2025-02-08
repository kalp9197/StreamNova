import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

<<<<<<< HEAD
// Load SSL certificates
const httpsConfig = {
	key: fs.readFileSync("key.pem"),
	cert: fs.readFileSync("cert.pem"),
};

export default defineConfig({
	plugins: [react()],
	server: {
		https: httpsConfig, // Enable HTTPS
		proxy: {
			"/api": {
				target: "http://localhost:8000",
			},
		},
		host: "localhost",
		port: 5173, // Ensure this matches your frontend port
	},
=======
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
>>>>>>> 5ce791b (finalizing project and ready for deployment)
});
