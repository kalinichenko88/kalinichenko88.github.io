import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kalinichenko88.github.io',
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
    svg: {
      mode: 'sprite',
    },
    responsiveImages: true,
    clientPrerender: true,
    headingIdCompat: true,
  },
});
