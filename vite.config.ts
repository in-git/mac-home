import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // 从 .env.development / .env.production 读取后端地址，仅作 dev server proxy 目标使用。
  // 注意：变量名故意不加 VITE_ 前缀，避免被 Vite 注入前端 bundle 而暴露后端地址（前端走同源 /api 转发）。
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.API_PROXY_TARGET || 'https://wwl.mx2d.cn';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    // sockjs-client / stompjs 等旧 UMD 包在浏览器端引用 Node 的 global，需注入 polyfill
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      include: ['sockjs-client', 'stompjs'],
    },
    server: {
      port: 14579,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/ws': {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
