import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'assets/*.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallbackDenylist: [/^\/api/],
      },
      manifest: {
        name: 'نظام إدارة الاختبارات والمهام',
        short_name: 'نظام الاختبارات',
        description: 'نظام متكامل لإدارة وتنفيذ الاختبارات الإلكترونية والتنبيهات المباشرة',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        dir: 'rtl',
        lang: 'ar',
        icons: [
          {
            src: '/assets/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/assets/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['@react-pdf/renderer'],
  },
  build: {
    // 👈 إضافة تعطيل polyfill هنا لمنع تحذيرات cross-world
    modulePreload: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@react-pdf/renderer')) {
              return 'vendor-pdf';
            }
            if (id.includes('handsontable') || id.includes('@handsontable/react')) {
              return 'vendor-handsontable';
            }
            if (id.includes('@tiptap') || id.includes('@uiw/react-md-editor')) {
              return 'vendor-editors';
            }
            if (id.includes('katex')) {
              return 'vendor-math';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor-core';
          }
        },
      },
    },
  },
  server: {
    port: 5050,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5051',
        changeOrigin: true,
        ws: true,
      },
      '/uploads': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5051',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5050,
    host: true,
  },
})