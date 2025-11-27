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
      output: {
        // ✅ ADD MANUAL CHUNKS FOR BETTER BUNDLE SPLITTING
        manualChunks: {
          // Split vendor libraries into separate chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux', 'redux'],
          ui: ['framer-motion', 'react-icons', 'react-spinners'],
          form: ['formik', 'yup'],
          utils: ['axios', 'lodash', 'prop-types'],
          // Add more groups based on your dependencies
        }
      },
    },
    // ✅ INCREASE CHUNK SIZE WARNING LIMIT
    chunkSizeWarningLimit: 1000, // Increase from default 500kB to 1000kB
  },
  optimizeDeps: {
    exclude: [
      // Remove Adyen from exclude - let it be optimized
    ],
    // ✅ OPTIONAL: Force pre-bundling of large dependencies
    include: ['axios', 'framer-motion', 'react-icons']
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