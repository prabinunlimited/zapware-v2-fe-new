// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // Make sure it's react-swc
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  build: {
    minify: 'esbuild',
    sourcemap: false
  }
})