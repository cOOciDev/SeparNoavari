import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendPort = env.VITE_DEV_SERVER_PORT || env.PORT || "5501";
  const proxyTarget = env.VITE_DEV_SERVER_URL || `http://127.0.0.1:${backendPort}`;
  const devPort = Number(env.VITE_DEV_PORT || 5173);

  return {
    plugins: [react()],
    server: {
      // host: "0.0.0.0",           // ← اگر لازم بود به شبکه بدهی، موقتاً 0.0.0.0 کن
      host: "127.0.0.1",           // ← اگر لازم بود به شبکه بدهی، موقتاً 0.0.0.0 کن
      port: devPort,
      strictPort: true,            // ← پورت ثابت
      allowedHosts: ["separnoavari.ir", "www.separnoavari.ir"],
      proxy: {
        "/api/": {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
