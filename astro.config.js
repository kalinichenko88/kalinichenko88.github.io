import { defineConfig, fontProviders, svgoOptimizer } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';

import { checkMetaTags } from './src/lib/check-meta-tags.ts';

const site = 'https://kalinichenko.dev';

export default defineConfig({
  site,
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    {
      name: 'meta-tags',
      hooks: {
        // A page whose link preview breaks a rule fails the build, so it never deploys.
        'astro:build:done': async ({ dir }) => {
          const problems = await checkMetaTags(dir, site);
          if (problems.length > 0) {
            throw new Error(`Meta tags break ${problems.length} rules:\n${problems.join('\n')}`);
          }
        },
      },
    },
  ],
  markdown: {
    // Astro 7 deprecates the flat `rehypePlugins` option; pass plugins to unified() instead.
    processor: unified({
      rehypePlugins: [[rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]],
    }),
  },
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
  fonts: [
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
  experimental: {
    clientPrerender: true,
    contentIntellisense: true,
    svgOptimizer: svgoOptimizer(),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
