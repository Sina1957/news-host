import { defineConfig } from "vite";
import { cpSync } from "node:fs";
import { resolve } from "node:path";

// کپی کردن فایلهای استاتیک (اسکریپت کلاسیک، تصاویر و ...) به پوشه خروجی
const copyStaticAssets = {
  name: "copy-static-assets",
  closeBundle() {
    cpSync(resolve("assets"), resolve("dist/assets"), { recursive: true });
  },
};

export default defineConfig({
  plugins: [copyStaticAssets],
  server: {
    port: 5173,
    open: true,
    // درخواستهای /api به سرور جاوا پاس داده میشوند
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve("index.html"),
        api: resolve("api-demo.html"),
      },
    },
  },
});
