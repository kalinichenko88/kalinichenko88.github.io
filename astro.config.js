import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kalinichenko.dev',
  integrations: [mdx(), sitemap()],
  devToolbar: {
    enabled: false,
  },
  image: {
    experimentalLayout: 'responsive',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  experimental: {
    responsiveImages: true,
    clientPrerender: true,
    contentIntellisense: true,
    fonts: [
      {
        provider: fontProviders.google(),
        name: 'IBM Plex Mono',
        cssVariable: '--font-mono',
      },
    ],
  },
});
