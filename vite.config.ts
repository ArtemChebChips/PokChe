import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// GitHub Pages project sites live under /repository/, not the domain root.
const base = process.env.PAGES_BASE_PATH || '/';
if (!base.startsWith('/') || !base.endsWith('/')) {
  throw new Error('PAGES_BASE_PATH должен начинаться и заканчиваться символом /');
}

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      scope: base,
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        id: base,
        name: 'PokChe — покер по шагам',
        short_name: 'PokChe',
        lang: 'ru',
        description: 'Короткие уроки и практика холдема',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f5faf7',
        theme_color: '#f5faf7',
        icons: [
          { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
