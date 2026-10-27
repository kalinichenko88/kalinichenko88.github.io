import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

import { MAX_DESCRIPTION, MAX_TITLE } from './consts';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './content/posts' }),
  schema: ({ image }) => {
    return z.object({
      // The page's og:title and description. The build checks them on the
      // page too; the limits here name the file while you write it.
      title: z.string().max(MAX_TITLE),
      description: z.string().max(MAX_DESCRIPTION),
      pubDate: z.date(),
      tags: z.array(z.string()),
      // Written by the illustrate-post skill. Optional so a post being written
      // still renders; tests/post-covers.test.ts makes it mandatory in CI.
      cover: image().optional(),
    });
  },
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './content/projects' }),
  schema: z.object({
    // The project page's og:title, as a post's title.
    name: z.string().max(MAX_TITLE),
    // `slug` is the GitHub repo name; the repo URL is derived from it.
    slug: z.string(),
    order: z.number(),
    // Required: with the GitHub description gone, this is the only card copy.
    // It is the project page's description too.
    tagline: z.string().max(MAX_DESCRIPTION),
    tech: z.array(z.string()).default([]),
    // Post tags (tests/post-tags.test.ts holds the vocabulary). /projects lists
    // every post sharing one of them as the project's related posts.
    tags: z.array(z.string()).default([]),
    // Live site, when the project has one. Falls back to the repo URL.
    homepage: z.url().optional(),
    // Fallback only: the build reads the live count from GitHub and uses this
    // when the API cannot answer (see src/lib/github-repo.ts).
    stars: z.number().default(0),
  }),
});

export const collections = {
  posts,
  projects,
};
