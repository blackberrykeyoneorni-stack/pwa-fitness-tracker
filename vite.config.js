import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // WICHTIG: Der Schrägstrich am Anfang und Ende muss sein!
  base: '/pwa-fitness-tracker/', 
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['vite.svg'],
      devOptions: {
        enabled: true
      },
      manifest: {
        id: 'pwa-fitness-tracker',
        name: 'Krafttraining Tracker',
        short_name: 'Training',
        description: 'Offline-First PWA für Krafttraining',
        theme_color: '#141218',
        background_color: '#141218',
        display: 'standalone',
        display_override: ['window-controls-overlay'],
        orientation: 'portrait',
        start_url: '/pwa-fitness-tracker/',
        scope: '/pwa-fitness-tracker/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ],
});