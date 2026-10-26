import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { githubRepo } from '../src/lib/github-repo.ts';

const REPO = 'https://github.com/kalinichenko88/obsidian-budget-planner-plugin';
// Recorded from the GitHub API. It also nests `template_repository` with its own
// `stargazers_count` (4551), which must not be the one read.
const recorded = readFileSync(new URL('./fixtures/github-repo.json', import.meta.url), 'utf8');

test('reads the live numbers from the repo API', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(recorded));

  assert.deepEqual(await githubRepo(REPO, 3), {
    stars: 11,
    issues: 1,
    forks: 0,
    language: 'TypeScript',
  });
  assert.equal(
    fetch.mock.calls[0].arguments[0],
    'https://api.github.com/repos/kalinichenko88/obsidian-budget-planner-plugin'
  );
});

test('falls back to the YAML stars and no other numbers when GitHub refuses', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 403 }));

  assert.deepEqual(await githubRepo('https://github.com/kalinichenko88/vaultmd', 3), {
    stars: 3,
    issues: 0,
    forks: 0,
    language: null,
  });
});

// The homepage, /projects and every project image read the numbers in one build.
test('asks GitHub once per repo, however many pages read it', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(recorded));
  const repo = 'https://github.com/kalinichenko88/ai-digest';

  assert.equal((await githubRepo(repo, 1)).stars, 11);
  assert.equal((await githubRepo(repo, 1)).stars, 11);
  assert.equal(fetch.mock.callCount(), 1);
});
