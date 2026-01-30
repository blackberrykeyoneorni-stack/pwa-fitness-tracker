import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Umstellung auf absoluten Pfad für korrekte Manifest-Referenzierung
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Nur tatsächlich vorhandene Assets aufnehmen
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
        start_url: '/',
        scope: '/',
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