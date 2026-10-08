import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './content/projects' }),
  schema: z.object({
    name: z.string(),
    // `slug` is the GitHub repo name; the repo URL is derived from it.
    slug: z.string(),
    order: z.number(),
    featured: z.boolean().default(false),
    // Required: with the GitHub description gone, this is the only card copy.
    tagline: z.string(),
    tech: z.array(z.string()).default([]),
    // Live site, when the project has one. Falls back to the repo URL.
    homepage: z.url().optional(),
    // Fallback only: the build reads the live count from GitHub and uses this
    // when the API cannot answer (see src/lib/github-stars.ts).
    stars: z.number().default(0),
  }),
});

export const collections = {
  posts,
  projects,
};
