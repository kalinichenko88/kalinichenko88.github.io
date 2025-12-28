import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { githubReposLoader } from './loaders/github-repos';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/posts' }),
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
    slug: z.string(),
    order: z.number(),
  }),
});

if (!import.meta.env.GITHUB_TOKEN) {
  throw new Error(
    'GITHUB_TOKEN environment variable is required. Create a .env file with your GitHub token.'
  );
}

const githubRepos = defineCollection({
  loader: githubReposLoader({
    auth: import.meta.env.GITHUB_TOKEN,
    username: 'kalinichenko88',
    includeForks: false,
  }),
  schema: z.object({
    name: z.string(),
    full_name: z.string(),
    description: z.string().nullable(),
    html_url: z.string().url(),
    homepage: z.string().url().nullish().or(z.literal('')).transform(val => val || null),
    stargazers_count: z.number(),
    forks_count: z.number(),
    language: z.string().nullable(),
    topics: z.array(z.string()),
    created_at: z.string(),
    updated_at: z.string(),
    pushed_at: z.string().nullable(),
    size: z.number(),
    open_issues_count: z.number(),
    default_branch: z.string(),
    private: z.boolean(),
    fork: z.boolean(),
  }),
});

export const collections = {
  posts,
  projects,
  githubRepos,
};
