import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0'
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.calil\.jp\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'calil-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24時間
              }
            }
          },
          {
            urlPattern: /^https:\/\/app\.rakuten\.co\.jp\/services\/api\/BooksBook\/Search\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'rakuten-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24時間
              }
            }
          }
        ]
      },
      manifest: {
        name: 'としょみる - 図書館検索アプリ',
        short_name: 'としょみる',
        description: '現在位置から最寄りの図書館を検索し、蔵書情報を調べることができるアプリです',
        theme_color: '#007bff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        id: 'toshomiru-library-finder',
        icons: [
          {
            src: 'icon.svg',
            sizes: '48x48 72x72 96x96 144x144 192x192 256x256 384x384 512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})
