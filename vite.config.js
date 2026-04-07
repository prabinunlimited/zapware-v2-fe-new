import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const isProduction = mode === "production";
  const isDevelopment = mode === "development";

  console.log(`🚀 Building for ${mode} environment`);
  console.log(`📦 API URL: ${env.VITE_API_URL || "Not set"}`);
  console.log(
    `💳 Adyen Environment: ${env.VITE_ADYEN_ENVIRONMENT || "test (default)"}`,
  );
  console.log(`🌍 App Environment: ${env.VITE_ENV || "development (default)"}`);
  console.log(`📱 App Name: ${env.VITE_APP_NAME || "ourzap"}`);
  console.log(`🔧 Production mode: ${isProduction}`);
  console.log(`🔧 Development mode: ${isDevelopment}`);

  const appName = env.VITE_APP_NAME || "ourzap";

  return {
    plugins: [
      react(),
      visualizer({
        filename: "dist/stats.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    },

    build: {
      outDir: "dist",
      minify: isProduction ? "terser" : "esbuild",
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          // ✅ FIXED: REMOVED the problematic auth-services chunk
          manualChunks: {
            // React core
            "react-vendor": ["react", "react-dom", "react-router-dom"],

            // State management
            "redux-vendor": ["@reduxjs/toolkit", "react-redux", "redux"],

            // UI libraries
            "ui-vendor": [
              "framer-motion",
              "react-icons",
              "react-spinners",
              "react-toastify",
            ],

            // Form libraries
            "form-vendor": ["formik", "yup", "react-select"],

            // HTTP client
            "axios-vendor": ["axios"],

            // ✅ FIXED: Split deposit modules correctly (keep these)
            "deposit-module": [
              "./src/page/Deposit/api/apiClient.js",
              "./src/page/Deposit/slices/depositSlice.js",
              "./src/page/Deposit/slices/bankAccountSlice.js",
              "./src/page/Deposit/slices/bankLinkSlice.js",
              "./src/page/Deposit/slices/bankLinkSliceIframe.js",
            ],

            // ✅ FIXED: Split payment components
            "payment-components": [
              "./src/page/Deposit/components/Card/CardPayment.jsx",
              "./src/page/Deposit/components/Card/CardPaymentIframe.jsx",
            ],

            // ✅ FIXED: Split auth features
            "auth-features": [
              "./src/features/Auth/authThunk.js",
              "./src/features/Auth/slices/authSlice.js",
              "./src/features/Auth/slices/signupSlice.js",
            ],

            // ✅ FIXED: Split payout features
            "payout-module": ["./src/page/Payout/slices/payoutSlice.js"],

            // ✅ FIXED: Split beneficiary features
            "beneficiary-module": [
              "./src/page/RequestRemit/Homepage/beneficiaryApi.js",
              "./src/page/RequestRemit/Homepage/beneficiaryHomepageSlice.js",
            ],
          },

          // Asset naming (keep as is)
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split(".");
            const extType = info[info.length - 1];

            if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }

            if (
              /\.(gif|jpe?g|png|svg|webp|avif|ico)(\?.*)?$/i.test(
                assetInfo.name,
              )
            ) {
              return `assets/images/[name]-[hash][extname]`;
            }

            if (/\.css$/i.test(assetInfo.name)) {
              return `assets/css/[name]-[hash][extname]`;
            }

            return `assets/[name]-[hash][extname]`;
          },

          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
        },
      },

      terserOptions: isProduction
        ? {
            compress: {
              drop_console: false,
              drop_debugger: false,
              pure_funcs: [],
            },
          }
        : {},
      chunkSizeWarningLimit: 1500,
    },

    server: {
      port: 3000,
      open: !isProduction,
      host: true,
      cors: true,
      proxy: isDevelopment
        ? {
            "/api": {
              target:
                env.VITE_API_URL || "https://zapware.unlimitedremit.com/api",
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, "/api"),
              secure: false,
            },
          }
        : {},
    },

    preview: {
      port: 4173,
      host: true,
      open: true,
      cors: true,
    },

    esbuild: {
      drop: [],
    },

    css: {
      devSourcemap: !isProduction,
    },

    define: {
      __APP_ENV__: JSON.stringify(env.VITE_ENV || "development"),
      __APP_NAME__: JSON.stringify(appName),
      __APP_VERSION__: JSON.stringify(
        process.env.npm_package_version || "1.0.0",
      ),
      __BUILD_MODE__: JSON.stringify(mode),
      __ADYEN_ENV__: JSON.stringify(env.VITE_ADYEN_ENVIRONMENT || "test"),
      __API_URL__: JSON.stringify(env.VITE_API_URL || ""),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __ENABLE_CONSOLE_LOGS__: JSON.stringify(true),
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "axios",
        "@reduxjs/toolkit",
        "react-redux",
        "framer-motion",
      ],
    },
  };
});
