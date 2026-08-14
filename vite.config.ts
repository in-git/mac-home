import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
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

      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},

      // 代理模式：前端请求走同源相对路径（VITE_API_BASE_URL 留空），
      // 由 dev server 转发到后端，避免浏览器跨域。
      proxy: {
        // 前端统一用 /api 前缀：/api/public/...（免登录）、/api/biz/...（需登录）
        // 代理转发到后端根并去掉 /api 前缀，即 /api/public/site/page -> https://wwl.mx2d.cn/public/site/page
        '/api': {
          target: 'https://wwl.mx2d.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/ws': {
          target: 'https://wwl.mx2d.cn',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
