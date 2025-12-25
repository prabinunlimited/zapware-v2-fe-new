import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, staging, production)
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';
  
  console.log(`🚀 Building for ${mode} environment`);
  console.log(`📦 API URL: ${env.VITE_API_URL || 'Not set'}`);
  console.log(`💳 Adyen Environment: ${env.VITE_ADYEN_ENVIRONMENT || 'test (default)'}`);
  console.log(`🌍 App Environment: ${env.VITE_ENV || 'development (default)'}`);
  console.log(`📱 App Name: ${env.VITE_APP_NAME || 'ourzap'}`);
  console.log(`🔧 Production mode: ${isProduction}`);
  console.log(`🔧 Development mode: ${isDevelopment}`);
  
  const appName = env.VITE_APP_NAME || 'ourzap';
  
  return {
    plugins: [
      react(),
    ],
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    
    build: {
      outDir: 'dist',
      minify: isProduction ? 'terser' : 'esbuild',
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            redux: ['@reduxjs/toolkit', 'react-redux', 'redux'],
            ui: ['framer-motion', 'react-icons', 'react-spinners'],
            payment: ['axios'],
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];
            
            if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            
            if (/\.(gif|jpe?g|png|svg|webp|avif|ico)(\?.*)?$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            
            if (/\.css$/i.test(assetInfo.name)) {
              return `assets/css/[name]-[hash][extname]`;
            }
            
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      // 🔥 REMOVED: terserOptions that drop console logs
      // 🔥 FIXED: Keep console logs in all environments
      terserOptions: isProduction ? {
        compress: {
          // ⚠️ REMOVE these lines to keep console logs:
          // drop_console: true,
          // drop_debugger: true,
          // 🔥 ADDED: Keep console logs but compress other code
          drop_console: false, // Keep console logs
          drop_debugger: false, // Keep debugger statements
          pure_funcs: [], // Don't remove any functions
        },
      } : {},
      chunkSizeWarningLimit: 1500,
    },
    
    server: {
      port: 3000,
      open: !isProduction,
      host: true,
      cors: true,
      proxy: isDevelopment ? {
        '/api': {
          target: env.VITE_API_URL || 'https://zapware.unlimitedremit.com/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
          secure: false,
        },
      } : {},
    },
    
    preview: {
      port: 4173,
      host: true,
      open: true,
      cors: true,
    },
    
    // 🔥 FIXED: Don't drop console in esbuild either
    esbuild: {
      drop: isProduction ? [] : [], // Empty array means don't drop anything
      // Or if you want to drop only in production but keep console:
      // drop: isProduction ? [] : [],
    },
    
    css: {
      devSourcemap: !isProduction,
    },
    
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_ENV || 'development'),
      __APP_NAME__: JSON.stringify(appName),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_MODE__: JSON.stringify(mode),
      __ADYEN_ENV__: JSON.stringify(env.VITE_ADYEN_ENVIRONMENT || 'test'),
      __API_URL__: JSON.stringify(env.VITE_API_URL || ''),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      // 🔥 ADDED: Enable console logs in production
      __ENABLE_CONSOLE_LOGS__: JSON.stringify(true),
    },
    
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        '@reduxjs/toolkit',
        'react-redux',
        'framer-motion',
      ],
    },
  };
});