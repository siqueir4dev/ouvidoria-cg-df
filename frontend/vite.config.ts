import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Participa DF Mobile',
        short_name: 'ParticipaDF',
        description: 'Sua voz na ouvidoria do DF',
        theme_color: '#1e3a8a',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'], // Cache these assets
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/manifestations'),
            handler: 'NetworkOnly', // Don't cache API POSTs, handle via Background Sync manually
            options: {
              backgroundSync: {
                name: 'manifestation-queue',
                options: {
                  maxRetentionTime: 24 * 60 // Retry for max 24 hours
                }
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: true, // Allow all hosts including ngrok
  },
})
