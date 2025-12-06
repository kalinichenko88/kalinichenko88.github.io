import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://kalinichenko.dev',
  integrations: [mdx(), sitemap()],
  devToolbar: {
    enabled: false,
  },
  server: {
    port: 3000,
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  experimental: {
    clientPrerender: true,
    contentIntellisense: true,
    fonts: [
      {
        provider: fontProviders.fontshare(),
        name: 'General Sans',
        cssVariable: '--font-general-sans',
        weights: [400, 500, 600, 700],
        fallbacks: ['system-ui', 'sans-serif'],
      },
      {
        provider: fontProviders.google(),
        name: 'DM Sans',
        cssVariable: '--font-dm-sans',
        weights: [400, 500, 600, 700],
        fallbacks: ['system-ui', 'sans-serif'],
      },
      {
        provider: fontProviders.google(),
        name: 'JetBrains Mono',
        cssVariable: '--font-jetbrains-mono',
        weights: [400, 500, 600],
        fallbacks: ['ui-monospace', 'monospace'],
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
