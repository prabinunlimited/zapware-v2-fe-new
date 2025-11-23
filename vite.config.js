// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  build: {
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      external: [
        // Remove Adyen from external - let it be bundled
      ],
    },
  },
  optimizeDeps: {
    exclude: [
      // Remove Adyen from exclude - let it be optimized
    ],
  },
  // Add CSS configuration
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler", // or 'modern' depending on your setup
      },
    },
  },
});
