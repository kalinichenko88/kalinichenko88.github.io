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

test('falls back to the YAML count when GitHub refuses', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 403 }));

  assert.equal(await githubStars(REPO, 3), 3);
});
