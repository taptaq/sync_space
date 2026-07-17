import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      // 每日锚点提醒依赖 service worker 存活；注入到 main 入口自动注册
      injectRegister: 'auto',
      manifest: {
        name: 'SyncSpace · 内在气候系统',
        short_name: 'SyncSpace',
        description: '在过载前而非过载后被推一把的预警系统。神经多样性友好的自我调节工具。',
        theme_color: '#6b5fa0',
        background_color: '#faf7f2',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'zh-CN',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        // 不缓存 Supabase 请求，避免脏数据
        navigateFallbackDenylist: [/^\/rest\/v1\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/rest/v1/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
