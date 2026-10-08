import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { githubStars } from '../src/lib/github-stars.ts';

const REPO = 'https://github.com/kalinichenko88/obsidian-budget-planner-plugin';
// Recorded from the GitHub API. It also nests `template_repository` with its own
// `stargazers_count` (4551), which must not be the one read.
const recorded = readFileSync(new URL('./fixtures/github-repo.json', import.meta.url), 'utf8');

test('reads the live count from the repo API', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(recorded));

  assert.equal(await githubStars(REPO, 3), 11);
  assert.equal(
    fetch.mock.calls[0].arguments[0],
    'https://api.github.com/repos/kalinichenko88/obsidian-budget-planner-plugin'
  );
});

test('authenticates with GITHUB_TOKEN when CI provides one', async (t) => {
  const previous = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = 'ci-token';
  t.after(() => {
    if (previous === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previous;
  });
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response(recorded));

  await githubStars(REPO, 3);
  const init = fetch.mock.calls[0].arguments[1] as RequestInit;
  assert.deepEqual(init.headers, { authorization: 'Bearer ci-token' });
});

test('falls back to the YAML count when GitHub refuses', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response('{"message":"API rate limit exceeded"}', {
        status: 403,
      })
  );

  assert.equal(await githubStars(REPO, 3), 3);
});

test('falls back to the YAML count when the network is down', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('fetch failed');
  });

  assert.equal(await githubStars(REPO, 3), 3);
});
