import { URL } from 'node:url';
import { defineConfig, fontProviders, svgoOptimizer } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';

import { checkMetaTags } from './src/lib/check-meta-tags.ts';

export default defineConfig({
  site: 'https://kalinichenko.dev',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    metaTags(),
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

/** Fails the build when a page's link-preview tags break a rule (src/lib/check-meta-tags.ts). */
function metaTags() {
  // The address the build resolves: CI passes its own --site and --base.
  let root = '';

  return {
    name: 'meta-tags',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = new URL(config.base.replace(/\/?$/, '/'), config.site).href;
      },
      'astro:build:done': async ({ dir, assets }) => {
        // Only the pages Astro rendered, not HTML copied from public/. 404.html
        // answers every missing address, so it has no address of its own.
        const pages = [...assets]
          .filter(([route]) => route !== '/404')
          .flatMap(([, files]) => files)
          .filter((file) => file.pathname.endsWith('.html'));
        const problems = await checkMetaTags(dir, root, pages);
        if (problems.length > 0) {
          throw new Error(`Meta tags break ${problems.length} rules:\n${problems.join('\n')}`);
        }
      },
    },
  };
}
